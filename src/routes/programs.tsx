import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Lock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs — BODYMESH" },
      { name: "description", content: "Trainer-led fitness programs from BODYMESH. Strength, HIIT, mobility, and endurance plans built for every level." },
      { property: "og:title", content: "Programs — BODYMESH" },
      { property: "og:description", content: "Pick your path. Strength, HIIT, mobility, and endurance from elite coaches." },
    ],
  }),
  component: ProgramsPage,
});

const TAGS = ["All", "Strength", "HIIT", "Mobility", "Endurance"] as const;
type Tag = (typeof TAGS)[number];

function ProgramsPage() {
  const [tag, setTag] = useState<Tag>("All");

  const programsQ = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (programsQ.data ?? []).filter((p) =>
    tag === "All" ? true : (p.category ?? "").toLowerCase() === tag.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border/60 py-16 md:py-28">
          <div className="container-bm">
            <span className="label-eyebrow">// Train</span>
            <h1 className="heading-display mt-4 text-balance text-5xl md:text-8xl">
              Programs built<br />by athletes.
            </h1>
            <p className="mt-6 max-w-2xl text-muted-foreground">
              From your first squat to your hundredth marathon. Every plan is structured, progressive, and led by a coach.
            </p>
            <div className="mt-10 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <Button
                  key={t}
                  variant={tag === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTag(t)}
                  className={tag === t ? "bg-coral text-coral-foreground hover:bg-coral/90" : ""}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="container-bm py-12 md:py-20">
          {programsQ.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="heading-display text-2xl">No programs in this category yet.</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try another filter or check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <Link
                  key={p.id}
                  to="/programs/$programId"
                  params={{ programId: p.id }}
                  className="group relative block overflow-hidden rounded-lg bg-card transition-smooth hover:shadow-elegant"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-coral" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                    {p.category && (
                      <Badge className="bg-coral text-coral-foreground hover:bg-coral">{p.category}</Badge>
                    )}
                    {p.is_premium && (
                      <Badge variant="outline" className="border-sand/50 bg-background/60 text-sand backdrop-blur">
                        <Lock className="mr-1 h-3 w-3" /> Premium
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="heading-display text-2xl">{p.title}</h3>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.trainer_name ?? "BODYMESH Coach"}</span>
                      <span className="capitalize">{p.duration_weeks}w · {p.difficulty}</span>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">
                        <Play className="mr-2 h-3 w-3" /> View program
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
