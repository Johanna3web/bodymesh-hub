import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Crown, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/overview")({
  head: () => ({ meta: [{ title: "Overview — BODYMESH Admin" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const sinceISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [users, premium, active, points] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("subscription_status", "premium"),
        supabase
          .from("progress_logs")
          .select("user_id", { count: "exact", head: true })
          .gte("completed_at", sinceISO),
        supabase.from("profiles").select("points"),
      ]);
      const totalPoints = (points.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0);
      return {
        users: users.count ?? 0,
        premium: premium.count ?? 0,
        active: active.count ?? 0,
        totalPoints,
      };
    },
  });

  const signups = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const enrollments = useQuery({
    queryKey: ["admin-recent-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_programs")
        .select("id, enrolled_at, user_id, programs:program_id(title), profiles:user_id(full_name, avatar_url)")
        .order("enrolled_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-display text-4xl md:text-5xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi loading={stats.isLoading} icon={Users} label="Total users" value={stats.data?.users ?? 0} />
        <Kpi loading={stats.isLoading} icon={Activity} label="Active 24h" value={stats.data?.active ?? 0} />
        <Kpi loading={stats.isLoading} icon={Crown} label="Premium" value={stats.data?.premium ?? 0} />
        <Kpi loading={stats.isLoading} icon={Coins} label="Total points" value={stats.data?.totalPoints ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent signups" cta={{ label: "All users", to: "/admin/users" }}>
          {signups.isLoading ? (
            <Skeleton className="h-48" />
          ) : (signups.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No signups yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {signups.data!.map((u) => {
                const initials = (u.full_name || u.email || "?").slice(0, 2).toUpperCase();
                return (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-coral/15 text-xs text-coral">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.full_name || "Athlete"}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(u.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Recent enrollments" cta={{ label: "All programs", to: "/admin/programs" }}>
          {enrollments.isLoading ? (
            <Skeleton className="h-48" />
          ) : (enrollments.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {enrollments.data!.map((row) => {
                const prof = row.profiles as { full_name?: string | null; avatar_url?: string | null } | null;
                const prog = row.programs as { title?: string | null } | null;
                const initials = (prof?.full_name || "?").slice(0, 2).toUpperCase();
                return (
                  <li key={row.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={prof?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-coral/15 text-xs text-coral">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{prof?.full_name || "Athlete"}</p>
                      <p className="truncate text-xs text-muted-foreground">{prog?.title ?? "—"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(row.enrolled_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, loading }: { icon: typeof Users; label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-coral" />
      </div>
      <div className="mt-3 text-3xl font-semibold">
        {loading ? <Skeleton className="h-8 w-20" /> : value.toLocaleString()}
      </div>
    </div>
  );
}

function Card({
  title,
  cta,
  children,
}: {
  title: string;
  cta?: { label: string; to: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-border">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="heading-display text-xl">{title}</h2>
        {cta && (
          <Link to={cta.to} className="text-xs text-coral hover:underline">
            {cta.label} →
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
