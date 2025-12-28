import 'dotenv/config';
import snmp from 'net-snmp';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Configuration
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 10000; // 10 seconds

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Store previous counter values for delta calculation
// Format: { router_id: { oid: { value: number, timestamp: Date } } }
const previousCounters = new Map();

// ============================================
// Utility Functions
// ============================================

/**
 * Format bytes to human readable format
 */
function formatBps(bps) {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
  return `${bps.toFixed(2)} bps`;
}

/**
 * Convert Mikrotik optical value to dBm
 * Mikrotik returns integer like -650 which means -6.50 dBm
 */
function convertToDbm(rawValue) {
  if (rawValue === null || rawValue === undefined) return null;
  
  // Mikrotik typically returns value * 100 or * 10
  // Example: -650 = -6.50 dBm, -2300 = -23.00 dBm
  const absValue = Math.abs(rawValue);
  
  if (absValue > 1000) {
    // Divide by 100 for values like -2300 -> -23.00
    return rawValue / 100;
  } else if (absValue > 100) {
    // Divide by 10 for values like -650 -> -65.0 (adjust if needed)
    return rawValue / 10;
  }
  
  // Already in dBm format
  return rawValue;
}

/**
 * Calculate bandwidth in bps from counter delta
 * SNMP counters are cumulative bytes, we need to calculate rate
 */
function calculateBps(routerId, oid, currentValue, currentTime) {
  const key = `${routerId}_${oid}`;
  const previous = previousCounters.get(key);
  
  // Store current value for next calculation
  previousCounters.set(key, {
    value: currentValue,
    timestamp: currentTime
  });
  
  if (!previous) {
    // First reading, can't calculate rate yet
    return null;
  }
  
  const timeDeltaSeconds = (currentTime - previous.timestamp) / 1000;
  
  if (timeDeltaSeconds <= 0) {
    return null;
  }
  
  let bytesDelta = currentValue - previous.value;
  
  // Handle counter wrap (32-bit counter max: 4294967295)
  if (bytesDelta < 0) {
    bytesDelta = (4294967295 - previous.value) + currentValue;
  }
  
  // Calculate bits per second: (bytes * 8) / seconds
  const bps = Math.round((bytesDelta * 8) / timeDeltaSeconds);
  
  return bps;
}

// ============================================
// SNMP Functions
// ============================================

/**
 * Poll a single OID from a router
 */
function pollOid(session, oid) {
  return new Promise((resolve, reject) => {
    if (!oid) {
      resolve(null);
      return;
    }
    
    session.get([oid], (error, varbinds) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (varbinds.length > 0) {
        const varbind = varbinds[0];
        
        if (snmp.isVarbindError(varbind)) {
          reject(new Error(snmp.varbindError(varbind)));
          return;
        }
        
        // Handle different value types
        let value = varbind.value;
        
        // Convert Buffer to number if needed
        if (Buffer.isBuffer(value)) {
          if (value.length <= 4) {
            value = value.readUIntBE(0, value.length);
          } else {
            value = parseInt(value.toString('hex'), 16);
          }
        }
        
        resolve(value);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Poll all OIDs from a router
 */
async function pollRouter(router) {
  const { id, name, ip_address, community_string, oid_interface_in, oid_interface_out, oid_sfp_rx } = router;
  
  console.log(`\n📡 Polling router: ${name} (${ip_address})`);
  
  // Create SNMP session
  const session = snmp.createSession(ip_address, community_string || 'public', {
    timeout: 5000,
    retries: 1,
    version: snmp.Version2c
  });
  
  const currentTime = new Date();
  let rxBps = null;
  let txBps = null;
  let sfpRxDbm = null;
  let isUp = true;
  
  try {
    // Poll interface IN (download/RX)
    if (oid_interface_in) {
      try {
        const rxCounter = await pollOid(session, oid_interface_in);
        if (rxCounter !== null) {
          rxBps = calculateBps(id, 'rx', rxCounter, currentTime);
          console.log(`  ↓ RX Counter: ${rxCounter} -> ${rxBps !== null ? formatBps(rxBps) : 'calculating...'}`);
        }
      } catch (err) {
        console.error(`  ❌ RX OID error: ${err.message}`);
      }
    }
    
    // Poll interface OUT (upload/TX)
    if (oid_interface_out) {
      try {
        const txCounter = await pollOid(session, oid_interface_out);
        if (txCounter !== null) {
          txBps = calculateBps(id, 'tx', txCounter, currentTime);
          console.log(`  ↑ TX Counter: ${txCounter} -> ${txBps !== null ? formatBps(txBps) : 'calculating...'}`);
        }
      } catch (err) {
        console.error(`  ❌ TX OID error: ${err.message}`);
      }
    }
    
    // Poll SFP RX optical power
    if (oid_sfp_rx) {
      try {
        const sfpRaw = await pollOid(session, oid_sfp_rx);
        if (sfpRaw !== null) {
          sfpRxDbm = convertToDbm(sfpRaw);
          console.log(`  📶 SFP RX: ${sfpRaw} -> ${sfpRxDbm} dBm`);
        }
      } catch (err) {
        console.error(`  ❌ SFP OID error: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error(`  ❌ SNMP session error: ${error.message}`);
    isUp = false;
  } finally {
    session.close();
  }
  
  return {
    router_id: id,
    rx_bps: rxBps,
    tx_bps: txBps,
    sfp_rx_dbm: sfpRxDbm,
    is_up: isUp
  };
}

// ============================================
// Database Functions
// ============================================

/**
 * Fetch all routers from database
 */
async function fetchRouters() {
  const { data, error } = await supabase
    .from('routers')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching routers:', error.message);
    return [];
  }
  
  return data || [];
}

/**
 * Save traffic log to database
 */
async function saveTrafficLog(log) {
  // Only save if we have calculated values (not first poll)
  if (log.rx_bps === null && log.tx_bps === null && log.sfp_rx_dbm === null) {
    console.log(`  ⏳ Skipping save - waiting for delta calculation`);
    return;
  }
  
  const { error } = await supabase
    .from('traffic_logs')
    .insert({
      router_id: log.router_id,
      rx_bps: log.rx_bps || 0,
      tx_bps: log.tx_bps || 0,
      sfp_rx_dbm: log.sfp_rx_dbm
    });
  
  if (error) {
    console.error(`  ❌ Error saving traffic log: ${error.message}`);
  } else {
    console.log(`  ✅ Traffic log saved`);
  }
}

/**
 * Update router status in database
 */
async function updateRouterStatus(routerId, status) {
  const { error } = await supabase
    .from('routers')
    .update({ status: status ? 'UP' : 'DOWN' })
    .eq('id', routerId);
  
  if (error) {
    console.error(`  ❌ Error updating router status: ${error.message}`);
  }
}

// ============================================
// Main Polling Loop
// ============================================

async function pollAllRouters() {
  console.log('\n' + '='.repeat(50));
  console.log(`🔄 Poll cycle started at ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
  
  const routers = await fetchRouters();
  
  if (routers.length === 0) {
    console.log('⚠️ No routers found in database');
    return;
  }
  
  console.log(`📋 Found ${routers.length} router(s) to poll`);
  
  for (const router of routers) {
    try {
      const result = await pollRouter(router);
      
      // Update router status
      await updateRouterStatus(result.router_id, result.is_up);
      
      // Save traffic log
      await saveTrafficLog(result);
      
    } catch (error) {
      console.error(`❌ Error polling ${router.name}: ${error.message}`);
      await updateRouterStatus(router.id, false);
    }
  }
  
  console.log('\n✅ Poll cycle completed');
}

// ============================================
// Start Poller
// ============================================

console.log('🚀 NOC SNMP Poller Starting...');
console.log(`📊 Supabase URL: ${SUPABASE_URL}`);
console.log(`⏱️ Poll interval: ${POLL_INTERVAL / 1000} seconds`);
console.log('');

// Initial poll
pollAllRouters();

// Set up interval polling
setInterval(pollAllRouters, POLL_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down SNMP Poller...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down SNMP Poller...');
  process.exit(0);
});
