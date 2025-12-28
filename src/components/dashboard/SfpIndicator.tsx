import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface SfpIndicatorProps {
  value: number | null;
  loading: boolean;
}

type SignalLevel = "good" | "warning" | "critical" | "unknown";

const getSignalLevel = (dbm: number | null): SignalLevel => {
  if (dbm === null) return "unknown";
  if (dbm > -15) return "good";
  if (dbm >= -24) return "warning";
  return "critical";
};

const getSignalColor = (level: SignalLevel): string => {
  switch (level) {
    case "good":
      return "text-signal-good";
    case "warning":
      return "text-signal-warning";
    case "critical":
      return "text-signal-critical";
    default:
      return "text-muted-foreground";
  }
};

const getSignalBgColor = (level: SignalLevel): string => {
  switch (level) {
    case "good":
      return "bg-signal-good/10";
    case "warning":
      return "bg-signal-warning/10";
    case "critical":
      return "bg-signal-critical/10";
    default:
      return "bg-muted";
  }
};

const getSignalLabel = (level: SignalLevel): string => {
  switch (level) {
    case "good":
      return "Signal Bagus";
    case "warning":
      return "Signal Lemah";
    case "critical":
      return "Signal Kritis";
    default:
      return "Tidak Ada Data";
  }
};

export const SfpIndicator = ({ value, loading }: SfpIndicatorProps) => {
  const signalLevel = getSignalLevel(value);
  const colorClass = getSignalColor(signalLevel);
  const bgClass = getSignalBgColor(signalLevel);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-primary" />
            SFP Optical Power
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-primary" />
          SFP Optical Power
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "rounded-xl p-6 text-center",
            bgClass
          )}
        >
          <div
            className={cn(
              "text-5xl font-bold mb-2",
              colorClass,
              signalLevel === "critical" && "animate-pulse-glow"
            )}
          >
            {value !== null ? `${value.toFixed(2)} dBm` : "N/A"}
          </div>
          <div className={cn("text-sm font-medium", colorClass)}>
            {getSignalLabel(signalLevel)}
          </div>
          
          {/* Signal Level Legend */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-signal-good" />
              <span className="text-muted-foreground">&gt; -15 dBm</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-signal-warning" />
              <span className="text-muted-foreground">-15 s/d -24</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-signal-critical" />
              <span className="text-muted-foreground">&lt; -24 dBm</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
