import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database["public"]["Enums"]["fitness_goal"];
type Level = Database["public"]["Enums"]["fitness_level"];

const GOALS: { id: Goal; label: string }[] = [
  { id: "weight_loss", label: "Weight Loss" },
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "endurance", label: "Endurance" },
  { id: "lifestyle", label: "Lifestyle" },
];

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", desc: "New to training" },
  { id: "intermediate", label: "Intermediate", desc: "Train 2-4x / week" },
  { id: "advanced", label: "Advanced", desc: "Train 5+ x / week" },
];

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — BODYMESH" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState<Goal>("muscle_gain");
  const [level, setLevel] = useState<Level>("beginner");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      if (profile.fitness_goal) setGoal(profile.fitness_goal);
      if (profile.fitness_level) setLevel(profile.fitness_level);
      if (profile.onboarded) navigate({ to: "/dashboard" });
    }
  }, [profile, navigate]);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name || profile?.full_name,
        bio,
        fitness_goal: goal,
        fitness_level: level,
        onboarded: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("You're all set.");
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="container-bm flex flex-col items-center py-12 md:py-20">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? "bg-coral" : "bg-muted"}`}
            />
          ))}
        </div>
        <div className="rounded-2xl bg-card p-8 ring-1 ring-border md:p-10">
          {step === 1 && (
            <>
              <h2 className="heading-display text-3xl md:text-4xl">What should we call you?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your name and a short bio for your profile.</p>
              <div className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Carter" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Lifter. Runner. Always learning." rows={3} />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="heading-display text-3xl md:text-4xl">What's your goal?</h2>
              <p className="mt-2 text-sm text-muted-foreground">We'll tailor recommendations to it.</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`rounded-md border px-4 py-4 text-left text-sm font-medium transition-smooth ${
                      goal === g.id
                        ? "border-coral bg-coral/10 text-coral"
                        : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="heading-display text-3xl md:text-4xl">Where are you at?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Pick the level that fits you today.</p>
              <div className="mt-8 space-y-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l.id)}
                    className={`flex w-full flex-col items-start rounded-md border px-4 py-4 text-left transition-smooth ${
                      level === l.id
                        ? "border-coral bg-coral/10"
                        : "border-border bg-muted hover:border-foreground/40"
                    }`}
                  >
                    <span className="text-sm font-semibold">{l.label}</span>
                    <span className="text-xs text-muted-foreground">{l.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="bg-gradient-coral text-primary-foreground shadow-coral"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={finish}
                disabled={saving}
                className="bg-gradient-coral text-primary-foreground shadow-coral"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
