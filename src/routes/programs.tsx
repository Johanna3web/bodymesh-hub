import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import strengthImg from "@/assets/program-strength.jpg";
import hiitImg from "@/assets/program-hiit.jpg";
import mobilityImg from "@/assets/program-mobility.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";

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

const PROGRAMS = [
  { img: strengthImg, title: "Iron Foundation", trainer: "Marco Reyes", weeks: 8, level: "Intermediate", tag: "Strength", premium: false },
  { img: hiitImg, title: "Burn / 21", trainer: "Aya Tanaka", weeks: 3, level: "All levels", tag: "HIIT", premium: false },
  { img: mobilityImg, title: "Flow State", trainer: "Lena Hart", weeks: 6, level: "Beginner", tag: "Mobility", premium: false },
  { img: enduranceImg, title: "Long Run Method", trainer: "David Okafor", weeks: 12, level: "Advanced", tag: "Endurance", premium: true },
  { img: strengthImg, title: "Power Block", trainer: "Marco Reyes", weeks: 10, level: "Advanced", tag: "Strength", premium: true },
  { img: hiitImg, title: "Metcon Lab", trainer: "Aya Tanaka", weeks: 4, level: "Intermediate", tag: "HIIT", premium: false },
  { img: mobilityImg, title: "Restore", trainer: "Lena Hart", weeks: 4, level: "All levels", tag: "Mobility", premium: false },
  { img: enduranceImg, title: "Marathon Build", trainer: "David Okafor", weeks: 16, level: "Advanced", tag: "Endurance", premium: true },
];

const TAGS = ["All", "Strength", "HIIT", "Mobility", "Endurance"] as const;

function ProgramsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border/60 py-20 md:py-28">
          <div className="container-bm">
            <span className="label-eyebrow">// Train</span>
            <h1 className="heading-display mt-4 text-balance text-6xl md:text-8xl">
              Programs built<br />by athletes.
            </h1>
            <p className="mt-6 max-w-2xl text-muted-foreground">
              From your first squat to your hundredth marathon. Every plan is structured, progressive, and led by a coach.
            </p>
            <div className="mt-10 flex flex-wrap gap-2">
              {TAGS.map((t, i) => (
                <Button key={t} variant={i === 0 ? "default" : "outline"} size="sm">
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="container-bm py-16 md:py-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PROGRAMS.map((p) => (
              <article key={p.title} className="group relative overflow-hidden rounded-lg bg-card transition-smooth hover:shadow-elegant">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.img} alt={p.title} loading="lazy" width={1024} height={1280}
                    className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                  <Badge className="bg-coral text-coral-foreground hover:bg-coral">{p.tag}</Badge>
                  {p.premium && <Badge variant="outline" className="border-sand/50 bg-background/60 text-sand backdrop-blur">Premium</Badge>}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="heading-display text-2xl">{p.title}</h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.trainer}</span>
                    <span>{p.weeks}w · {p.level}</span>
                  </div>
                  <Link to="/signup" className="mt-4 block">
                    <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">
                      <Play className="mr-2 h-3 w-3" /> Start program
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
