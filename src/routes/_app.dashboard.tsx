import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Calendar, ArrowRight, Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BODYMESH" },
      { name: "description", content: "Your training dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();

  const enrollmentsQ = useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_programs")
        .select("*, programs(*)")
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const recentLogsQ = useQuery({
    queryKey: ["recent-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const totalWorkouts = recentLogsQ.data?.length ?? 0;
  const points = profile?.points ?? 0;
  const enrollments = enrollmentsQ.data ?? [];
  const firstName = profile?.full_name?.split(" ")[0] || "Athlete";

  return (
    <main className="container-bm py-10 md:py-16">
      <div className="flex flex-col gap-2">
        <span className="label-eyebrow">// Today</span>
        <h1 className="heading-display text-5xl md:text-6xl">Welcome back, {firstName}.</h1>
        <p className="text-muted-foreground">Pick up where you left off.</p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Flame} label="Recent workouts" value={String(totalWorkouts)} />
        <StatCard icon={Trophy} label="Points" value={String(points)} />
        <StatCard icon={Dumbbell} label="Enrolled" value={String(enrollments.length)} />
        <StatCard icon={Calendar} label="Plan" value={profile?.subscription_status === "premium" ? "Premium" : "Free"} />
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-3xl">Your programs</h2>
          <Link to="/programs">
            <Button variant="ghost" size="sm">Browse all <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>

        {enrollmentsQ.isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => {
              const p = e.programs;
              if (!p) return null;
              return (
                <Link
                  key={e.id}
                  to="/programs/$programId"
                  params={{ programId: p.id }}
                  className="group relative overflow-hidden rounded-xl bg-card ring-1 ring-border transition-smooth hover:shadow-elegant"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    {p.thumbnail_url ? (
                      <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-gradient-coral" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] uppercase">{p.category ?? "Training"}</Badge>
                      <span className="text-xs text-muted-foreground">{e.completed_workouts} done</span>
                    </div>
                    <h3 className="heading-display mt-2 text-xl">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">{p.trainer_name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10">
        <Dumbbell className="h-6 w-6 text-coral" />
      </div>
      <h3 className="heading-display mt-4 text-2xl">No programs yet</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Pick a coach-led program to get started. New plans drop every month.
      </p>
      <Link to="/programs" className="mt-6">
        <Button className="bg-gradient-coral text-primary-foreground shadow-coral">Browse programs</Button>
      </Link>
    </div>
  );
}
