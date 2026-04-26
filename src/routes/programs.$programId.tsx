import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Clock, Lock, ChevronLeft, Play, Trophy } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LazyVideo } from "@/components/LazyVideo";

interface Exercise {
  name: string;
  sets?: number;
  reps?: string | number;
  rest?: string;
  notes?: string;
}

export const Route = createFileRoute("/programs/$programId")({
  loader: async ({ params }) => {
    const { data: program } = await supabase
      .from("programs")
      .select("*")
      .eq("id", params.programId)
      .maybeSingle();
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.program.title} — BODYMESH` },
          { name: "description", content: loaderData.program.description ?? "Train with a coach-led BODYMESH program." },
          { property: "og:title", content: `${loaderData.program.title} — BODYMESH` },
          { property: "og:description", content: loaderData.program.description ?? "Train with BODYMESH." },
          ...(loaderData.program.thumbnail_url
            ? [
                { property: "og:image", content: loaderData.program.thumbnail_url },
                { name: "twitter:image", content: loaderData.program.thumbnail_url },
              ]
            : []),
        ]
      : [],
  }),
  component: ProgramDetailPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-bm py-24 text-center">
        <h1 className="heading-display text-5xl">Program not found</h1>
        <p className="mt-4 text-muted-foreground">It may have been removed or the link is incorrect.</p>
        <Link to="/programs" className="mt-6 inline-block">
          <Button>Browse programs</Button>
        </Link>
      </main>
    </div>
  ),
});

function ProgramDetailPage() {
  const { program } = Route.useLoaderData();
  const { user, isAuthenticated, isPremium } = useAuth();
  const queryClient = useQueryClient();

  const workoutsQ = useQuery({
    queryKey: ["program-workouts", program.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("program_id", program.id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const enrollmentQ = useQuery({
    queryKey: ["enrollment", program.id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_programs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("program_id", program.id)
        .maybeSingle();
      return data;
    },
  });

  const logsQ = useQuery({
    queryKey: ["program-logs", program.id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("program_id", program.id);
      if (error) throw error;
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to enroll");
      const { error } = await supabase
        .from("user_programs")
        .insert({ user_id: user.id, program_id: program.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Enrolled in ${program.title}`);
      void queryClient.invalidateQueries({ queryKey: ["enrollment", program.id] });
      void queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      if (!user) throw new Error("Sign in to track progress");
      const { error } = await supabase.from("progress_logs").insert({
        user_id: user.id,
        program_id: program.id,
        workout_id: workoutId,
      });
      if (error) throw error;

      const newCount = (enrollmentQ.data?.completed_workouts ?? 0) + 1;
      if (enrollmentQ.data) {
        await supabase
          .from("user_programs")
          .update({ completed_workouts: newCount })
          .eq("id", enrollmentQ.data.id);
      }
    },
    onSuccess: () => {
      toast.success("Workout complete. +10 points");
      void queryClient.invalidateQueries({ queryKey: ["program-logs", program.id] });
      void queryClient.invalidateQueries({ queryKey: ["enrollment", program.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completedIds = new Set((logsQ.data ?? []).map((l) => l.workout_id).filter(Boolean));
  const workouts = workoutsQ.data ?? [];
  const totalWorkouts = workouts.length;
  const enrolled = !!enrollmentQ.data;
  const completedCount = workouts.filter((w) => completedIds.has(w.id)).length;
  const progressPct = totalWorkouts > 0 ? Math.round((completedCount / totalWorkouts) * 100) : 0;
  const locked = program.is_premium && !isPremium;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0">
            {program.thumbnail_url ? (
              <img src={program.thumbnail_url} alt="" className="h-full w-full object-cover opacity-30" />
            ) : (
              <div className="h-full w-full bg-gradient-coral opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          </div>
          <div className="container-bm relative py-12 md:py-20">
            <Link to="/programs" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-3 w-3" /> All programs
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {program.category && (
                <Badge className="bg-coral text-coral-foreground hover:bg-coral">{program.category}</Badge>
              )}
              {program.is_premium && (
                <Badge variant="outline" className="border-sand/40 text-sand">
                  <Lock className="mr-1 h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
            <h1 className="heading-display mt-4 text-5xl md:text-7xl">{program.title}</h1>
            <p className="mt-3 text-base text-muted-foreground">By {program.trainer_name ?? "BODYMESH Coach"}</p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <Stat label="Weeks" value={String(program.duration_weeks)} />
              <Stat label="Workouts" value={String(totalWorkouts)} />
              <Stat label="Level" value={program.difficulty} capitalize />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {!isAuthenticated ? (
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral">
                    Sign up to enroll
                  </Button>
                </Link>
              ) : enrolled ? (
                <Badge variant="outline" className="border-coral text-coral text-sm py-2 px-4">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Enrolled
                </Badge>
              ) : locked ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toast.info("Premium checkout is coming soon — PayFast integration is on the way.")}
                >
                  <Lock className="mr-2 h-4 w-4" /> Unlock with Premium
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="bg-gradient-coral text-primary-foreground shadow-coral"
                >
                  {enrollMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {program.price > 0 ? `Enroll · R${program.price}` : "Enroll free"}
                </Button>
              )}
            </div>

            {enrolled && totalWorkouts > 0 && (
              <div className="mt-6 max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Your progress</span>
                  <span className="font-semibold text-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            )}
          </div>
        </section>

        <section className="container-bm py-12 md:py-16">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workouts">Workouts</TabsTrigger>
              <TabsTrigger value="trainer">About Trainer</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="prose prose-invert max-w-none lg:col-span-2">
                  <p className="text-base text-muted-foreground">
                    {program.description ?? "A focused, progressive training plan designed by a BODYMESH coach to take you from where you are to where you want to be."}
                  </p>
                </div>
                <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
                  <h3 className="heading-display text-xl">What you get</h3>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-coral" /> {totalWorkouts} structured workouts</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-coral" /> {program.duration_weeks}-week progression</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-coral" /> Coach-built exercise library</li>
                    <li className="flex gap-2"><Trophy className="h-4 w-4 shrink-0 text-coral" /> Earn points & badges as you progress</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workouts" className="mt-8">
              {workoutsQ.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading workouts…</div>
              ) : workouts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No workouts published yet.</div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {workouts.map((w, idx) => {
                    const done = completedIds.has(w.id);
                    const exercises = (w.exercises as unknown as Exercise[]) ?? [];
                    return (
                      <AccordionItem key={w.id} value={w.id} className="border-border">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex w-full items-center gap-4 pr-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2 font-medium">
                                {w.title}
                                {done && <CheckCircle2 className="h-4 w-4 text-coral" />}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {w.duration_mins} min
                                </span>
                                <span>{exercises.length} exercises</span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {w.description && <p className="mb-4 text-sm text-muted-foreground">{w.description}</p>}
                          {w.video_url && (
                            <div className="mb-4">
                              <LazyVideo src={w.video_url} title={w.title} poster={w.thumbnail_url} />
                            </div>
                          )}
                          <div className="space-y-2">
                            {exercises.map((ex, i) => (
                              <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3 text-sm">
                                <div>
                                  <div className="font-medium">{ex.name}</div>
                                  {ex.notes && <div className="text-xs text-muted-foreground">{ex.notes}</div>}
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  {ex.sets && <div>{ex.sets} × {ex.reps ?? "—"}</div>}
                                  {ex.rest && <div>Rest {ex.rest}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                          {enrolled && !locked && (
                            <div className="mt-4 flex justify-end">
                              {done ? (
                                <Badge variant="outline" className="border-coral text-coral">
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => completeMutation.mutate(w.id)}
                                  disabled={completeMutation.isPending}
                                  className="bg-gradient-coral text-primary-foreground"
                                >
                                  {completeMutation.isPending ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-3 w-3" />
                                  )}
                                  Mark complete
                                </Button>
                              )}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="trainer" className="mt-8">
              <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
                <h3 className="heading-display text-2xl">{program.trainer_name ?? "BODYMESH Coach"}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Hand-picked by BODYMESH to design programs that push you while keeping form first. More about your coach coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-xl bg-card/80 p-4 ring-1 ring-border backdrop-blur">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</div>
    </div>
  );
}
