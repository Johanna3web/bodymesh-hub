import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BMLogo } from "@/components/BMLogo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — BODYMESH" },
      { name: "description", content: "Sign in to your BODYMESH account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-bm flex items-center justify-center py-20">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 ring-1 ring-border md:p-10">
          <div className="text-center">
            <BMLogo />
            <h1 className="heading-display mt-6 text-4xl">Welcome back.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to keep training.</p>
          </div>
          <form className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@bodymesh.com" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-coral hover:underline">Forgot?</a>
              </div>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-gradient-coral text-primary-foreground shadow-coral">
              Sign in
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="font-semibold text-coral hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
