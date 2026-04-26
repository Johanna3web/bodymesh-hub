import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/community")({
  head: () => ({ meta: [{ title: "Community — BODYMESH Admin" }] }),
  component: AdminCommunityPage,
});

type AdminPost = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  post_type: string;
  flag_count: number;
  likes_count: number;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

function AdminCommunityPage() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "id, content, image_url, created_at, user_id, post_type, flag_count, likes_count, profiles:user_id(full_name, avatar_url)"
        )
        .order("flag_count", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminPost[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post removed");
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-4xl md:text-5xl">Community</h1>
        <p className="mt-1 text-sm text-muted-foreground">{q.data?.length ?? 0} posts. Flagged posts surface first.</p>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No posts yet.
        </p>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((p) => {
            const initials = (p.profiles?.full_name ?? "?").slice(0, 2).toUpperCase();
            return (
              <article key={p.id} className="rounded-xl bg-card p-4 ring-1 ring-border">
                <header className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.profiles?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-coral/15 text-xs text-coral">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.profiles?.full_name ?? "Athlete"}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(p.created_at)} · {p.post_type} · {p.likes_count} likes
                    </p>
                  </div>
                  {p.flag_count > 0 && (
                    <Badge variant="outline" className="border-destructive text-destructive">
                      <Flag className="mr-1 h-3 w-3" /> {p.flag_count}
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this post permanently?")) del.mutate(p.id);
                    }}
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </header>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{p.content}</p>
                {p.image_url && (
                  <img src={p.image_url} alt="" className="mt-3 max-h-64 w-full rounded-lg object-cover" />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
