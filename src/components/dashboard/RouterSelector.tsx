import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Router } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type RouterType = Tables<"routers">;

interface RouterSelectorProps {
  routers: RouterType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export const RouterSelector = ({
  routers,
  selectedId,
  onSelect,
  loading,
}: RouterSelectorProps) => {
  if (loading) {
    return (
      <div className="w-full max-w-sm">
        <div className="h-10 bg-muted rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Select value={selectedId || ""} onValueChange={onSelect}>
        <SelectTrigger className="w-full bg-card border-border">
          <div className="flex items-center gap-2">
            <Router className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Pilih Router..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {routers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Tidak ada router. Tambahkan di menu Devices.
            </div>
          ) : (
            routers.map((router) => (
              <SelectItem key={router.id} value={router.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      router.status === "UP" ? "bg-status-up" : "bg-status-down"
                    )}
                  />
                  <span>{router.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({router.ip_address})
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
