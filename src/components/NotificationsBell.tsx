import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const unread = notifs.filter((n) => !n.read).length;

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 ring-1 ring-border transition-smooth hover:ring-foreground/40" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full bg-coral px-1 text-[10px] text-coral-foreground">
              {unread}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => markAll.mutate()}>
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">You're all caught up.</div>
          ) : (
            notifs.map((n) => (
              <div key={n.id} className={`flex items-start gap-2 px-3 py-3 ${!n.read ? "bg-muted/40" : ""}`}>
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-coral" style={{ opacity: n.read ? 0.2 : 1 }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title ?? "Update"}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
