import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type TrafficLog = Tables<"traffic_logs">;

export const useTrafficLogs = (routerId: string | null, minutes: number = 30) => {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [latestLog, setLatestLog] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!routerId) {
      setLogs([]);
      setLatestLog(null);
      setLoading(false);
      return;
    }

    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("traffic_logs")
      .select("*")
      .eq("router_id", routerId)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching traffic logs:", error);
    } else {
      setLogs(data || []);
      if (data && data.length > 0) {
        setLatestLog(data[data.length - 1]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime changes for this router
    const channel = supabase
      .channel(`traffic-logs-${routerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "traffic_logs",
          filter: routerId ? `router_id=eq.${routerId}` : undefined,
        },
        (payload) => {
          const newLog = payload.new as TrafficLog;
          setLogs((prev) => {
            const since = Date.now() - minutes * 60 * 1000;
            const filtered = prev.filter(
              (log) => new Date(log.created_at).getTime() > since
            );
            return [...filtered, newLog];
          });
          setLatestLog(newLog);
        }
      )
      .subscribe();

    // Also poll every 5 seconds as backup
    const interval = setInterval(fetchLogs, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [routerId, minutes]);

  return { logs, latestLog, loading, refetch: fetchLogs };
};
