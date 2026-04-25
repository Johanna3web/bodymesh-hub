import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BMLogo } from "@/components/BMLogo";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

const GOALS = [
  { id: "weight_loss", label: "Weight Loss" },
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "endurance", label: "Endurance" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

const schema = z.object({
  fullName: z.string().min(2, "Tell us your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join — BODYMESH" },
      { name: "description", content: "Create your BODYMESH account and join the fitness community." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("muscle_gain");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: values.fullName,
          fitness_goal: goal,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not create account");
      return;
    }

    toast.success("Account created — check your email to verify.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-bm flex items-center justify-center py-12 md:py-20">
        <div className="w-full max-w-lg rounded-2xl bg-card p-8 ring-1 ring-border md:p-10">
          <div className="text-center">
            <BMLogo />
            <h1 className="heading-display mt-6 text-4xl">Join the community.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Free to start. Premium when you're ready.</p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" placeholder="Alex Carter" autoComplete="name" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@bodymesh.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" placeholder="At least 8 characters" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Your fitness goal</Label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`rounded-md border px-4 py-3 text-sm font-medium transition-smooth ${
                      goal === g.id
                        ? "border-coral bg-coral/10 text-coral"
                        : "border-border bg-muted text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-coral text-primary-foreground shadow-coral"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="font-semibold text-coral hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
