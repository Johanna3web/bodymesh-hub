import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BMLogo } from "@/components/BMLogo";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join — BODYMESH" },
      { name: "description", content: "Create your BODYMESH account and join the fitness community." },
    ],
  }),
  component: SignupPage,
});

const GOALS = [
  { id: "weight-loss", label: "Weight Loss" },
  { id: "muscle-gain", label: "Muscle Gain" },
  { id: "endurance", label: "Endurance" },
  { id: "lifestyle", label: "Lifestyle" },
] as const;

function SignupPage() {
  const [goal, setGoal] = useState<string>("muscle-gain");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-bm flex items-center justify-center py-20">
        <div className="w-full max-w-lg rounded-2xl bg-card p-8 ring-1 ring-border md:p-10">
          <div className="text-center">
            <BMLogo />
            <h1 className="heading-display mt-6 text-4xl">Join the community.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Free to start. Premium when you're ready.</p>
          </div>
          <form className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Alex Carter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@bodymesh.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" />
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

            <Button type="submit" className="w-full bg-gradient-coral text-primary-foreground shadow-coral">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" className="font-semibold text-coral hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
