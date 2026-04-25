import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Loader2, Image as ImageIcon, Calendar, TrendingUp, Clock, Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { calcStreak, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — BODYMESH" },
      { name: "description", content: "Track your workouts, streaks, and transformation photos." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useAuth();

  const logsQ = useQuery({
    queryKey: ["progress-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_logs")
        .select("id, completed_at, duration_mins, notes, program_id, workout_id, programs(title), workouts(title)")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const programsQ = useQuery({
    queryKey: ["enrolled-programs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_programs")
        .select("program_id, programs(id, title)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const photosQ = useQuery({
    queryKey: ["progress-photos", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("progress").list(user!.id, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 100,
      });
      if (error) throw error;
      return data;
    },
  });

  const logs = logsQ.data ?? [];
  const dates = logs.map((l) => l.completed_at);
  const streak = calcStreak(dates);
  const total = logs.length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const thisWeek = logs.filter((l) => new Date(l.completed_at) >= weekStart).length;
  const avgDuration = total > 0
    ? Math.round(logs.reduce((s, l) => s + (l.duration_mins ?? 0), 0) / total)
    : 0;
  const longest = longestStreak(dates);

  return (
    <main className="container-bm py-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-eyebrow">// Progress</span>
          <h1 className="heading-display mt-2 text-5xl md:text-6xl">Track everything</h1>
          <p className="mt-2 text-muted-foreground">Workouts, streaks, transformations.</p>
        </div>
        <LogWorkoutDialog programs={programsQ.data ?? []} />
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={TrendingUp} label="Total workouts" value={String(total)} />
        <Stat icon={Calendar} label="This week" value={String(thisWeek)} />
        <Stat icon={Flame} label="Longest streak" value={`${longest} days`} />
        <Stat icon={Clock} label="Avg duration" value={`${avgDuration} min`} />
      </div>

      {/* Streak calendar */}
      <section className="mt-10 rounded-2xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl">Last 6 weeks</h2>
          <span className="text-xs text-muted-foreground">Current streak: <span className="font-semibold text-coral">{streak} days</span></span>
        </div>
        <StreakCalendar dates={dates} />
      </section>

      {/* History */}
      <section className="mt-10">
        <h2 className="heading-display text-2xl">Workout history</h2>
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-border">
          {logsQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : logs.length === 0 ? (
            <div className="bg-card p-8 text-center text-sm text-muted-foreground">
              No workouts yet. Click "Log workout" to start.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Program</th>
                  <th className="px-4 py-2 text-left">Workout</th>
                  <th className="px-4 py-2 text-right">Duration</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const programTitle = (l as unknown as { programs: { title: string } | null }).programs?.title;
                  const workoutTitle = (l as unknown as { workouts: { title: string } | null }).workouts?.title;
                  return (
                    <tr key={l.id} className="border-t border-border bg-card">
                      <td className="px-4 py-3 text-muted-foreground">{new Date(l.completed_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{programTitle ?? "—"}</td>
                      <td className="px-4 py-3">{workoutTitle ?? "Custom"}</td>
                      <td className="px-4 py-3 text-right">{l.duration_mins ?? 0} min</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Photos */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl">Progress photos</h2>
          <UploadPhotoButton />
        </div>
        {photosQ.isLoading ? (
          <Skeleton className="mt-4 h-40" />
        ) : (photosQ.data?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Upload your first photo to start tracking changes.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photosQ.data!.map((f) => <ProgressPhoto key={f.id ?? f.name} name={f.name} />)}
          </div>
        )}
      </section>
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

function StreakCalendar({ dates }: { dates: string[] }) {
  const days = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  const cells: { key: string; active: boolean; date: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    cells.push({ key: k, active: days.has(k), date: d });
  }
  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {cells.map((c) => (
        <div
          key={c.key}
          title={`${c.date.toDateString()}${c.active ? " — workout" : ""}`}
          className={`aspect-square rounded ${c.active ? "bg-coral" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function longestStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = Array.from(new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))).sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const next = new Date(days[i]);
    const diff = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 1;
    }
  }
  return best;
}

function LogWorkoutDialog({ programs }: { programs: Array<{ program_id: string; programs: { id: string; title: string } | null }> }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState<string>("");
  const [workoutId, setWorkoutId] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState("");

  const workoutsQ = useQuery({
    queryKey: ["workouts-of", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase.from("workouts").select("id, title").eq("program_id", programId).order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("progress_logs").insert({
        user_id: user.id,
        program_id: programId || null,
        workout_id: workoutId || null,
        duration_mins: duration,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workout logged");
      setOpen(false);
      setProgramId(""); setWorkoutId(""); setDuration(30); setNotes("");
      qc.invalidateQueries({ queryKey: ["progress-logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-coral text-primary-foreground shadow-coral">
          <Plus className="mr-1 h-4 w-4" /> Log workout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Program</Label>
            <select
              value={programId}
              onChange={(e) => { setProgramId(e.target.value); setWorkoutId(""); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Custom workout —</option>
              {programs.map((p) => (
                <option key={p.program_id} value={p.program_id}>{p.programs?.title}</option>
              ))}
            </select>
          </div>
          {programId ? (
            <div className="space-y-2">
              <Label>Workout</Label>
              <select
                value={workoutId}
                onChange={(e) => setWorkoutId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                {(workoutsQ.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={duration} min={1} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" />
          </div>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full bg-gradient-coral text-primary-foreground">
            {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadPhotoButton() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("progress").upload(path, file);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Photo uploaded");
      qc.invalidateQueries({ queryKey: ["progress-photos"] });
    }
  };

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gradient-coral px-3 py-2 text-sm font-medium text-primary-foreground shadow-coral">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      Upload photo
      <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={busy} />
    </label>
  );
}

function ProgressPhoto({ name }: { name: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const path = `${user!.id}/${name}`;

  const url = useQuery({
    queryKey: ["progress-url", path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("progress").createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="aspect-square overflow-hidden rounded-lg ring-1 ring-border transition-smooth hover:opacity-90"
      >
        {url.data ? <img src={url.data} alt="" className="h-full w-full object-cover" /> : <Skeleton className="h-full w-full" />}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xs text-muted-foreground">{timeAgo(new Date(parseInt(name.split(".")[0]) || Date.now()).toISOString())}</DialogTitle>
          </DialogHeader>
          {url.data ? <img src={url.data} alt="" className="w-full rounded-lg" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
