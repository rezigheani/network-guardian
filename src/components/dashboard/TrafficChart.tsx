import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type TrafficLog = Tables<"traffic_logs">;

interface TrafficChartProps {
  logs: TrafficLog[];
  loading: boolean;
}

// Format bps to human readable with auto unit selection
const formatBps = (bps: number): string => {
  if (bps === 0) return "0 bps";
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
  return `${bps.toFixed(0)} bps`;
};

// Smart Y-axis formatter that auto-selects unit based on max value
const formatYAxis = (value: number, maxValue: number): string => {
  if (maxValue >= 1e9) {
    return `${(value / 1e9).toFixed(1)}G`;
  } else if (maxValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (maxValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return `${value.toFixed(0)}`;
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TrafficChart = ({ logs, loading }: TrafficChartProps) => {
  const { chartData, maxValue, unit } = useMemo(() => {
    // Find max value to determine the best unit
    let max = 0;
    logs.forEach((log) => {
      if (log.rx_bps > max) max = log.rx_bps;
      if (log.tx_bps > max) max = log.tx_bps;
    });

    // Determine unit and divisor based on max value
    let divisor = 1;
    let unitLabel = "bps";
    if (max >= 1e9) {
      divisor = 1e9;
      unitLabel = "Gbps";
    } else if (max >= 1e6) {
      divisor = 1e6;
      unitLabel = "Mbps";
    } else if (max >= 1e3) {
      divisor = 1e3;
      unitLabel = "Kbps";
    }

    const data = logs.map((log) => ({
      time: formatTime(log.created_at),
      rx: log.rx_bps / divisor,
      tx: log.tx_bps / divisor,
      rxRaw: log.rx_bps,
      txRaw: log.tx_bps,
    }));

    return { chartData: data, maxValue: max, unit: unitLabel };
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatBps(entry.payload[`${entry.dataKey}Raw`])}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Traffic Bandwidth
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Traffic Bandwidth (30 Menit Terakhir)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            Tidak ada data traffic. Pastikan SNMP Poller berjalan.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}`}
                label={{
                  value: unit,
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="rx"
                name="Download (RX)"
                stroke="hsl(var(--chart-rx))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="tx"
                name="Upload (TX)"
                stroke="hsl(var(--chart-tx))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
