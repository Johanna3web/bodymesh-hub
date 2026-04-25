import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Trophy, Lock, Check, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { daysBetween } from "@/lib/format";

export const Route = createFileRoute("/_app/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — BODYMESH" },
      { name: "description", content: "Compete in weekly challenges, climb the leaderboard, earn badges." },
    ],
  }),
  component: ChallengesPage,
});

const DAILY_TASKS_BY_TITLE: Record<string, string[]> = {
  "21-Day Consistency Challenge": ["Log a workout", "Drink 2L water", "Get 7+ hours sleep"],
  "30-Day Glute Growth": ["Complete daily glute workout", "Log protein intake (1.6g/kg)", "Stretch 10 minutes"],
  "Summer Shred — 6 Weeks": ["Hit calorie target", "Complete daily workout", "10k+ steps"],
};

function ChallengesPage() {
  const { user, isPremium } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);

  const challengesQ = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("challenges").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const myEntriesQ = useQuery({
    queryKey: ["my-entries", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("challenge_entries").select("*").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const join = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("challenge_entries").insert({
        challenge_id: challengeId,
        user_id: user.id,
        points: 0,
        tasks_completed: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-entries"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Joined challenge!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const challenges = challengesQ.data ?? [];
  const myEntries = myEntriesQ.data ?? [];
  const activeChallenge = active
    ? challenges.find((c) => c.id === active)
    : myEntries[0]
      ? challenges.find((c) => c.id === myEntries[0].challenge_id)
      : challenges[0];

  return (
    <main className="container-bm py-10 md:py-16">
      <div>
        <span className="label-eyebrow">// Compete</span>
        <h1 className="heading-display mt-2 text-5xl md:text-6xl">Challenges</h1>
        <p className="mt-2 text-muted-foreground">Weekly tasks. Daily streaks. Real rewards.</p>
      </div>

      {/* Hero cards */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challengesQ.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
        ) : (
          challenges.map((c) => {
            const joined = myEntries.some((e) => e.challenge_id === c.id);
            const daysLeft = c.end_date ? Math.max(0, daysBetween(new Date(), new Date(c.end_date))) : null;
            const locked = c.is_premium && !isPremium;
            return (
              <div key={c.id} className="group relative overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-smooth hover:shadow-elegant">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-coral" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  {c.is_premium ? (
                    <Badge className="absolute right-3 top-3 bg-coral/90 text-coral-foreground"><Crown className="mr-1 h-3 w-3" /> Premium</Badge>
                  ) : (
                    <Badge variant="outline" className="absolute right-3 top-3 bg-background/70">Free</Badge>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="heading-display text-2xl">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {daysLeft !== null ? `${daysLeft} days left` : "Open"}</span>
                    <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {c.reward_points} pts {c.reward_badge ? `+ ${c.reward_badge}` : ""}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {joined ? (
                      <Button variant="outline" disabled className="flex-1"><Check className="mr-1 h-4 w-4" /> Joined</Button>
                    ) : locked ? (
                      <Link to="/store" className="flex-1">
                        <Button variant="outline" className="w-full"><Lock className="mr-1 h-4 w-4" /> Upgrade to join</Button>
                      </Link>
                    ) : (
                      <Button
                        className="flex-1 bg-gradient-coral text-primary-foreground shadow-coral"
                        onClick={() => join.mutate(c.id)}
                        disabled={join.isPending}
                      >
                        {join.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                        Join challenge
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setActive(c.id)}>Details</Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail panel: tabs */}
      {activeChallenge ? (
        <section className="mt-14 rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-eyebrow">// Selected</span>
              <h2 className="heading-display mt-2 text-3xl">{activeChallenge.title}</h2>
            </div>
          </div>
          <Tabs defaultValue="leaderboard" className="mt-6">
            <TabsList>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="progress">My progress</TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard" className="mt-4">
              <Leaderboard challengeId={activeChallenge.id} />
            </TabsContent>
            <TabsContent value="progress" className="mt-4">
              <MyProgress
                challengeId={activeChallenge.id}
                title={activeChallenge.title}
                joined={myEntries.some((e) => e.challenge_id === activeChallenge.id)}
              />
            </TabsContent>
          </Tabs>
        </section>
      ) : null}
    </main>
  );
}

function Leaderboard({ challengeId }: { challengeId: string }) {
  const q = useQuery({
    queryKey: ["leaderboard", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_entries")
        .select("id, points, tasks_completed, user_id, profiles:user_id(full_name, avatar_url)")
        .eq("challenge_id", challengeId)
        .order("points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <Skeleton className="h-40" />;
  if (!q.data || q.data.length === 0)
    return <p className="text-sm text-muted-foreground">No entries yet. Be the first.</p>;

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Athlete</th>
            <th className="px-4 py-2 text-right">Tasks</th>
            <th className="px-4 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {q.data.map((row, i) => {
            const prof = (row as unknown as { profiles: { full_name: string | null; avatar_url: string | null } | null }).profiles;
            return (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={prof?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-coral/15 text-[10px] text-coral">
                        {(prof?.full_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{prof?.full_name ?? "Athlete"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{row.tasks_completed}</td>
                <td className="px-4 py-3 text-right font-semibold text-coral">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MyProgress({ challengeId, title, joined }: { challengeId: string; title: string; joined: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [done, setDone] = useState<Set<string>>(new Set());

  const tasks = DAILY_TASKS_BY_TITLE[title] ?? ["Complete a workout", "Log your meal", "Hydrate"];

  const tickTask = useMutation({
    mutationFn: async (task: string) => {
      if (!user) throw new Error("Sign in required");
      // increment locally + on entry
      const { data: entry, error: selErr } = await supabase
        .from("challenge_entries")
        .select("id, points, tasks_completed")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (selErr) throw selErr;
      if (!entry) throw new Error("Join the challenge first");
      const { error: upErr } = await supabase
        .from("challenge_entries")
        .update({ points: entry.points + 10, tasks_completed: entry.tasks_completed + 1 })
        .eq("id", entry.id);
      if (upErr) throw upErr;
      // bump profile points
      const { data: prof } = await supabase.from("profiles").select("points").eq("id", user.id).maybeSingle();
      if (prof) await supabase.from("profiles").update({ points: prof.points + 10 }).eq("id", user.id);
      setDone((s) => new Set(s).add(task));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["my-entries"] });
      toast.success("+10 points");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!joined) {
    return <p className="text-sm text-muted-foreground">Join this challenge to track daily tasks.</p>;
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">Today · {today}</p>
      <ul className="mt-3 space-y-2">
        {tasks.map((t) => {
          const isDone = done.has(t);
          return (
            <li key={t} className="flex items-center justify-between rounded-md bg-muted/40 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isDone || tickTask.isPending}
                  onChange={() => tickTask.mutate(t)}
                  className="h-4 w-4 accent-coral"
                />
                <span className={isDone ? "line-through text-muted-foreground" : ""}>{t}</span>
              </label>
              <Badge variant="outline" className="text-[10px]">+10 pts</Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
