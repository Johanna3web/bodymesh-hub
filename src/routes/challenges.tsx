import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — BODYMESH" },
      { name: "description", content: "Weekly fitness challenges, leaderboards, and rewards in the BODYMESH community." },
      { property: "og:title", content: "Challenges — BODYMESH" },
      { property: "og:description", content: "Compete weekly. Climb the leaderboard. Earn badges." },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-bm py-32 text-center">
        <Construction className="mx-auto h-12 w-12 text-coral" />
        <span className="label-eyebrow mt-6 block">// Coming soon</span>
        <h1 className="heading-display mt-4 text-balance text-5xl md:text-7xl">Challenges</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Weekly leaderboards, daily task lists, and badge rewards. Sign up to be first in line.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup"><Button className="bg-gradient-coral text-primary-foreground">Join</Button></Link>
          <Link to="/"><Button variant="outline">Back home</Button></Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
