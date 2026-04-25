import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Award, Dumbbell, ArrowRight, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { calcStreak, daysBetween, greeting, timeAgo } from "@/lib/format";

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
  const firstName = profile?.full_name?.split(" ")[0] || "Athlete";

  const enrollmentsQ = useQuery({
    queryKey: ["dash-enrollments", user?.id],
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

  const logsQ = useQuery({
    queryKey: ["dash-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_logs")
        .select("completed_at")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const badgesQ = useQuery({
    queryKey: ["dash-badges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const challengesQ = useQuery({
    queryKey: ["dash-challenges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_entries")
        .select("*, challenges(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const feedQ = useQuery({
    queryKey: ["dash-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("id, content, image_url, created_at, user_id, likes_count, profiles:user_id(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const recsQ = useQuery({
    queryKey: ["dash-recs", profile?.fitness_goal],
    queryFn: async () => {
      let q = supabase.from("programs").select("*").limit(2);
      if (profile?.fitness_goal) q = q.eq("category", profile.fitness_goal);
      const { data, error } = await q;
      if (error) throw error;
      // fallback if zero matches
      if (!data || data.length === 0) {
        const { data: any2 } = await supabase.from("programs").select("*").limit(2);
        return any2 ?? [];
      }
      return data;
    },
  });

  const totalWorkouts = logsQ.data?.length ?? 0;
  const streak = calcStreak((logsQ.data ?? []).map((l) => l.completed_at));
  const points = profile?.points ?? 0;
  const badgeCount = badgesQ.data?.length ?? 0;
  const enrollments = enrollmentsQ.data ?? [];
  const activeProgram = enrollments.find((e) => !e.is_completed) ?? enrollments[0];
  const activeChallenge = challengesQ.data?.[0];

  return (
    <main className="container-bm py-10 md:py-16">
      <div className="flex flex-col gap-2">
        <span className="label-eyebrow">// Today</span>
        <h1 className="heading-display text-5xl md:text-6xl">{greeting()}, {firstName} 💪</h1>
        <p className="text-muted-foreground">Here's where you stand.</p>
      </div>

      {/* Stats row */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Dumbbell} label="Workouts" value={String(totalWorkouts)} />
        <StatCard icon={Flame} label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
        <StatCard icon={Trophy} label="Points" value={String(points)} />
        <StatCard icon={Award} label="Badges" value={String(badgeCount)} />
      </div>

      {/* Active program + active challenge */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Active program */}
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <span className="label-eyebrow">// Active program</span>
          </div>
          {enrollmentsQ.isLoading ? (
            <Skeleton className="m-5 h-40" />
          ) : !activeProgram || !activeProgram.programs ? (
            <div className="px-5 pb-6">
              <p className="text-sm text-muted-foreground">No active program. Pick one to start training.</p>
              <Link to="/programs" className="mt-4 inline-block">
                <Button className="bg-gradient-coral text-primary-foreground">Browse programs</Button>
              </Link>
            </div>
          ) : (
            <ActiveProgramCard
              programId={activeProgram.programs.id}
              title={activeProgram.programs.title}
              thumb={activeProgram.programs.thumbnail_url}
              trainer={activeProgram.programs.trainer_name}
              completed={activeProgram.completed_workouts}
            />
          )}
        </div>

        {/* Active challenge */}
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <span className="label-eyebrow">// Active challenge</span>
          </div>
          {challengesQ.isLoading ? (
            <Skeleton className="m-5 h-40" />
          ) : !activeChallenge || !activeChallenge.challenges ? (
            <div className="px-5 pb-6">
              <p className="text-sm text-muted-foreground">You're not in a challenge yet. Compete and earn rewards.</p>
              <Link to="/challenges" className="mt-4 inline-block">
                <Button className="bg-gradient-coral text-primary-foreground">View challenges</Button>
              </Link>
            </div>
          ) : (
            <ActiveChallengeCard
              title={activeChallenge.challenges.title}
              endDate={activeChallenge.challenges.end_date}
              points={activeChallenge.points}
              thumb={activeChallenge.challenges.thumbnail_url}
            />
          )}
        </div>
      </div>

      {/* Community feed preview */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-3xl">Community pulse</h2>
          <Link to="/community">
            <Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </Link>
        </div>
        {feedQ.isLoading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (feedQ.data?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Be the first to share your journey.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {feedQ.data!.map((p) => {
              const prof = (p as unknown as { profiles: { full_name: string | null; avatar_url: string | null } | null }).profiles;
              return (
                <Link key={p.id} to="/community" className="rounded-xl bg-card p-4 ring-1 ring-border transition-smooth hover:shadow-elegant">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={prof?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-coral/15 text-[10px] text-coral">
                        {(prof?.full_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{prof?.full_name ?? "Athlete"}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(p.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/90">{p.content}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">♥ {p.likes_count}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommended */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-3xl flex items-center gap-2"><Sparkles className="h-6 w-6 text-coral" /> Recommended for you</h2>
          <Link to="/programs"><Button variant="ghost" size="sm">All programs <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
        </div>
        {recsQ.isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recsQ.data?.map((p) => (
              <Link
                key={p.id}
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
                  <Badge variant="outline" className="text-[10px] uppercase">{p.category ?? "Training"}</Badge>
                  <h3 className="heading-display mt-2 text-xl">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.trainer_name}</p>
                </div>
              </Link>
            ))}
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

function ActiveProgramCard({ programId, title, thumb, trainer, completed }: { programId: string; title: string; thumb: string | null; trainer: string | null; completed: number }) {
  // We don't know total workouts here without a query; show completed count.
  const { data: total = 0 } = useQuery({
    queryKey: ["program-total", programId],
    queryFn: async () => {
      const { count } = await supabase.from("workouts").select("*", { count: "exact", head: true }).eq("program_id", programId);
      return count ?? 0;
    },
  });
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="px-5 pb-6">
      <div className="flex gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md">
          {thumb ? <img src={thumb} alt={title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-coral" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="heading-display text-2xl">{title}</h3>
          <p className="text-xs text-muted-foreground">{trainer}</p>
          <div className="mt-3">
            <Progress value={pct} className="h-2" />
            <p className="mt-1 text-[11px] text-muted-foreground">{completed} of {total} workouts • {pct}%</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Link to="/programs/$programId" params={{ programId }}>
          <Button className="bg-gradient-coral text-primary-foreground shadow-coral">Continue</Button>
        </Link>
      </div>
    </div>
  );
}

function ActiveChallengeCard({ title, endDate, points, thumb }: { title: string; endDate: string | null; points: number; thumb: string | null }) {
  const daysLeft = endDate ? Math.max(0, daysBetween(new Date(), new Date(endDate))) : null;
  return (
    <div className="px-5 pb-6">
      <div className="flex gap-4">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md">
          {thumb ? <img src={thumb} alt={title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-coral" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="heading-display text-2xl">{title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {daysLeft !== null ? `${daysLeft} days left` : "Ongoing"}</span>
            <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {points} pts</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Link to="/challenges">
          <Button className="bg-gradient-coral text-primary-foreground shadow-coral">View challenge</Button>
        </Link>
      </div>
    </div>
  );
}
