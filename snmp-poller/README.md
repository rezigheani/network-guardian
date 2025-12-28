# NOC SNMP Poller

Script Node.js untuk polling data SNMP dari router dan menyimpan ke database Supabase.

## Fitur

- ✅ Poll SNMP setiap 10 detik (configurable)
- ✅ Hitung bandwidth (bps) dari delta counter SNMP
- ✅ Konversi nilai optik Mikrotik ke dBm
- ✅ Update status router (UP/DOWN)
- ✅ Simpan traffic log ke Supabase

## Instalasi

```bash
# Masuk ke folder snmp-poller
cd snmp-poller

# Install dependencies
npm install
```

## Konfigurasi

1. Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

2. Edit file `.env` dan isi `SUPABASE_SERVICE_ROLE_KEY`:

```env
SUPABASE_URL=https://bdtmlouoipuckrhfjvsu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
POLL_INTERVAL=10000
```

> **Catatan**: Service Role Key bisa didapat dari Supabase Dashboard > Settings > API

## Menjalankan

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## Contoh OID Mikrotik

| Deskripsi | OID |
|-----------|-----|
| Interface In Octets (ether1) | `.1.3.6.1.2.1.2.2.1.10.1` |
| Interface Out Octets (ether1) | `.1.3.6.1.2.1.2.2.1.16.1` |
| SFP RX Power | `.1.3.6.1.4.1.14988.1.1.19.1.1.2.1` |

> **Tips**: Ganti angka terakhir sesuai index interface di router Anda.

## Cara Kerja

### Perhitungan Bandwidth (bps)

```
Delta Bytes = Current Counter - Previous Counter
Bandwidth (bps) = (Delta Bytes × 8) / Time Interval (seconds)
```

SNMP mengembalikan total counter bytes yang terus bertambah. Script menyimpan nilai sebelumnya dan menghitung selisih (delta) untuk mendapatkan rate per detik.

### Konversi Nilai Optik (dBm)

Mikrotik mengembalikan nilai integer seperti `-650` yang berarti `-6.50 dBm`:

```
Jika |value| > 1000: value / 100
Jika |value| > 100: value / 10
Lainnya: value (sudah dalam dBm)
```

## Output Contoh

```
🚀 NOC SNMP Poller Starting...
📊 Supabase URL: https://xxx.supabase.co
⏱️ Poll interval: 10 seconds

==================================================
🔄 Poll cycle started at 12/28/2024, 4:30:00 PM
==================================================
📋 Found 2 router(s) to poll

📡 Polling router: Router Utama (192.168.1.1)
  ↓ RX Counter: 1234567890 -> 125.50 Mbps
  ↑ TX Counter: 987654321 -> 45.25 Mbps
  📶 SFP RX: -650 -> -6.5 dBm
  ✅ Traffic log saved

📡 Polling router: Router Backup (192.168.1.2)
  ↓ RX Counter: 555666777 -> 85.30 Mbps
  ↑ TX Counter: 333444555 -> 22.10 Mbps
  ✅ Traffic log saved

✅ Poll cycle completed
```

## Troubleshooting

### SNMP Timeout
- Pastikan IP router bisa diakses dari server
- Pastikan community string benar
- Pastikan SNMP service aktif di router

### Counter Wrap
Script otomatis menangani counter wrap untuk 32-bit counter (max 4,294,967,295).

### Nilai Null
Poll pertama akan menghasilkan nilai null karena belum ada data sebelumnya untuk perhitungan delta. Nilai akan muncul di poll kedua.
