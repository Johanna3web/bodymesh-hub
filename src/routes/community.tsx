import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — BODYMESH" },
      { name: "description", content: "The BODYMESH community feed — athletes sharing progress, transformations, and motivation." },
      { property: "og:title", content: "Community — BODYMESH" },
      { property: "og:description", content: "A feed of athletes pushing each other forward, every day." },
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
        <h1 className="heading-display mt-4 text-balance text-5xl md:text-7xl">Community Feed</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A real social feed for athletes — posts, transformations, and conversations.
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
