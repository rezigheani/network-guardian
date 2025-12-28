import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Router = Tables<"routers">;

export const useRouters = () => {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRouters = async () => {
    const { data, error } = await supabase
      .from("routers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching routers:", error);
    } else {
      setRouters(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRouters();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("routers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "routers" },
        () => {
          fetchRouters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addRouter = async (router: Omit<Router, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("routers")
      .insert(router)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateRouter = async (id: string, updates: Partial<Router>) => {
    const { data, error } = await supabase
      .from("routers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteRouter = async (id: string) => {
    const { error } = await supabase.from("routers").delete().eq("id", id);
    if (error) throw error;
  };

  const upCount = routers.filter((r) => r.status === "UP").length;
  const downCount = routers.filter((r) => r.status === "DOWN").length;

  return {
    routers,
    loading,
    upCount,
    downCount,
    addRouter,
    updateRouter,
    deleteRouter,
    refetch: fetchRouters,
  };
};
