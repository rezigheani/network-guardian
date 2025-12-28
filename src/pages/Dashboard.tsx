import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RouterSelector } from "@/components/dashboard/RouterSelector";
import { TrafficChart } from "@/components/dashboard/TrafficChart";
import { SfpIndicator } from "@/components/dashboard/SfpIndicator";
import { useRouters } from "@/hooks/useRouters";
import { useTrafficLogs } from "@/hooks/useTrafficLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";

const formatBps = (bps: number): string => {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
  return `${bps} bps`;
};

const Dashboard = () => {
  const { routers, loading: routersLoading } = useRouters();
  const [selectedRouterId, setSelectedRouterId] = useState<string | null>(null);
  
  const { logs, latestLog, loading: logsLoading } = useTrafficLogs(
    selectedRouterId,
    30
  );

  const selectedRouter = routers.find((r) => r.id === selectedRouterId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor traffic dan status router secara real-time
            </p>
          </div>
          <RouterSelector
            routers={routers}
            selectedId={selectedRouterId}
            onSelect={setSelectedRouterId}
            loading={routersLoading}
          />
        </div>

        {selectedRouterId ? (
          <>
            {/* Current Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-chart-rx" />
                    Download (RX)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-rx">
                    {latestLog ? formatBps(latestLog.rx_bps) : "0 bps"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-chart-tx" />
                    Upload (TX)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-tx">
                    {latestLog ? formatBps(latestLog.tx_bps) : "0 bps"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestLog
                      ? new Date(latestLog.created_at).toLocaleTimeString("id-ID")
                      : "-"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TrafficChart logs={logs} loading={logsLoading} />
              </div>
              <div>
                <SfpIndicator
                  value={latestLog?.sfp_rx_dbm ?? null}
                  loading={logsLoading}
                />
              </div>
            </div>

            {/* Router Info */}
            {selectedRouter && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Router Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedRouter.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IP Address:</span>
                      <p className="font-medium">{selectedRouter.ip_address}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p
                        className={
                          selectedRouter.status === "UP"
                            ? "font-medium text-status-up"
                            : "font-medium text-status-down"
                        }
                      >
                        {selectedRouter.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Community:</span>
                      <p className="font-medium">{selectedRouter.community_string}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg mb-2">Pilih router untuk melihat data traffic</p>
                <p className="text-sm">
                  Gunakan dropdown di atas untuk memilih router yang ingin dipantau
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
