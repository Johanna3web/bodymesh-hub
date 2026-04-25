import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Award, Trophy, Dumbbell, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database["public"]["Enums"]["fitness_goal"];
type Level = Database["public"]["Enums"]["fitness_level"];

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — BODYMESH" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh, roles } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState<Goal>("muscle_gain");
  const [level, setLevel] = useState<Level>("beginner");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    if (profile.fitness_goal) setGoal(profile.fitness_goal);
    if (profile.fitness_level) setLevel(profile.fitness_level);
  }, [profile]);

  // Stats
  const enrollmentsQ = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_programs")
        .select("id, completed_workouts, is_completed, programs(id, title, thumbnail_url, trainer_name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const challengesQ = useQuery({
    queryKey: ["my-challenges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("challenge_entries").select("id").eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const allBadgesQ = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badges").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const myBadgesQ = useQuery({
    queryKey: ["my-badges-set", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_badges").select("badge_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.badge_id));
    },
  });

  const recentLogsQ = useQuery({
    queryKey: ["profile-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_logs")
        .select("id, completed_at, duration_mins, notes, workouts(title), programs(title)")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const enrollments = enrollmentsQ.data ?? [];
  const programsCount = enrollments.length;
  const challengesCount = challengesQ.data?.length ?? 0;
  const myBadges = myBadgesQ.data ?? new Set<string>();
  const earnedBadges = (allBadgesQ.data ?? []).filter((b) => myBadges.has(b.id));
  const points = profile?.points ?? 0;

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setUploading(false);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    await refresh();
    toast.success("Avatar updated");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, bio, fitness_goal: goal, fitness_level: level })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile saved");
  };

  return (
    <main className="container-bm py-10 md:py-16">
      {/* Cover */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-coral p-8 ring-1 ring-border md:p-10">
        <div className="grain absolute inset-0" />
        <div className="relative flex flex-col items-center gap-4 text-center text-coral-foreground sm:flex-row sm:text-left">
          <label className="relative cursor-pointer">
            <Avatar className="h-24 w-24 ring-4 ring-background/40">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="bg-background text-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] font-semibold uppercase opacity-0 transition-opacity hover:opacity-100">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
          <div className="flex-1">
            <h1 className="heading-display text-4xl md:text-5xl">{profile?.full_name || "Athlete"}</h1>
            <p className="mt-1 text-sm opacity-80">{user?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1 sm:justify-start">
              {roles.map((r) => (
                <Badge key={r} className="bg-background/30 text-coral-foreground text-[10px] uppercase">{r}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Dumbbell} label="Programs" value={String(programsCount)} />
        <Stat icon={Trophy} label="Challenges" value={String(challengesCount)} />
        <Stat icon={Award} label="Badges" value={String(earnedBadges.length)} />
        <Stat icon={Activity} label="Points" value={String(points)} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="edit" className="mt-10">
        <TabsList>
          <TabsTrigger value="edit">Edit profile</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="programs">My programs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-6">
          <section className="space-y-6 rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fitness goal</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["weight_loss", "muscle_gain", "endurance", "lifestyle"] as Goal[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`rounded-md border px-3 py-2 text-xs font-medium capitalize transition-smooth ${
                        goal === g ? "border-coral bg-coral/10 text-coral" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fitness level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`rounded-md border px-3 py-2 text-xs font-medium capitalize transition-smooth ${
                        level === l ? "border-coral bg-coral/10 text-coral" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-coral text-primary-foreground shadow-coral">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <section className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            {allBadgesQ.isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {(allBadgesQ.data ?? []).map((b) => {
                  const earned = myBadges.has(b.id);
                  return (
                    <div key={b.id} className={`rounded-xl bg-muted/40 p-4 text-center transition-smooth ${earned ? "" : "opacity-40 grayscale"}`}>
                      <div className="text-3xl">{b.icon ?? "🏅"}</div>
                      <p className="mt-2 text-xs font-semibold">{b.name}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{b.requirement}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="programs" className="mt-6">
          {enrollmentsQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : enrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-sm text-muted-foreground">No enrolled programs yet.</p>
              <Link to="/programs" className="mt-4 inline-block">
                <Button className="bg-gradient-coral text-primary-foreground">Browse programs</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {enrollments.map((e) => {
                const p = e.programs;
                if (!p) return null;
                return (
                  <Link
                    key={e.id}
                    to="/programs/$programId"
                    params={{ programId: p.id }}
                    className="flex gap-4 rounded-xl bg-card p-4 ring-1 ring-border transition-smooth hover:shadow-elegant"
                  >
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md">
                      {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-coral" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="heading-display text-lg">{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.trainer_name}</p>
                      <ProgramProgress programId={p.id} completed={e.completed_workouts} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <section className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            {recentLogsQ.isLoading ? (
              <Skeleton className="h-40" />
            ) : (recentLogsQ.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentLogsQ.data!.map((l) => {
                  const w = (l as unknown as { workouts: { title: string } | null }).workouts;
                  const p = (l as unknown as { programs: { title: string } | null }).programs;
                  return (
                    <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium">{w?.title ?? "Custom workout"}</p>
                        <p className="text-xs text-muted-foreground">{p?.title ?? "Free training"} · {l.duration_mins ?? 0} min</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(l.completed_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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

function ProgramProgress({ programId, completed }: { programId: string; completed: number }) {
  const { data: total = 0 } = useQuery({
    queryKey: ["program-total", programId],
    queryFn: async () => {
      const { count } = await supabase.from("workouts").select("*", { count: "exact", head: true }).eq("program_id", programId);
      return count ?? 0;
    },
  });
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="mt-2">
      <ProgressBar value={pct} className="h-1.5" />
      <p className="mt-1 text-[10px] text-muted-foreground">{completed} / {total} • {pct}%</p>
    </div>
  );
}
