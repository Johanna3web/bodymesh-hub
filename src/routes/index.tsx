import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Trophy, Users, LineChart, Play, Zap, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/hero-athlete.jpg";
import strengthImg from "@/assets/program-strength.jpg";
import hiitImg from "@/assets/program-hiit.jpg";
import mobilityImg from "@/assets/program-mobility.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";
import storeImg from "@/assets/store-banner.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BODYMESH — Active Lifestyle. Train. Track. Belong." },
      { name: "description", content: "Join the BODYMESH fitness community. Premium training programs, challenges, progress tracking, and the activewear that moves with you." },
      { property: "og:title", content: "BODYMESH — Active Lifestyle" },
      { property: "og:description", content: "Premium fitness ecosystem from the activewear brand. Programs, challenges, community." },
      { property: "og:image", content: "/og-home.jpg" },
      { name: "twitter:image", content: "/og-home.jpg" },
    ],
  }),
  component: HomePage,
});

const PROGRAMS = [
  { img: strengthImg, title: "Iron Foundation", trainer: "Marco Reyes", weeks: 8, level: "Intermediate", tag: "Strength" },
  { img: hiitImg, title: "Burn / 21", trainer: "Aya Tanaka", weeks: 3, level: "All levels", tag: "HIIT" },
  { img: mobilityImg, title: "Flow State", trainer: "Lena Hart", weeks: 6, level: "Beginner", tag: "Mobility" },
  { img: enduranceImg, title: "Long Run Method", trainer: "David Okafor", weeks: 12, level: "Advanced", tag: "Endurance" },
];

const FEATURES = [
  { icon: Activity, label: "Programs", desc: "Trainer-led plans built around your goal." },
  { icon: Trophy, label: "Challenges", desc: "Compete weekly. Climb the leaderboard." },
  { icon: Users, label: "Community", desc: "A feed of athletes pushing each other." },
  { icon: LineChart, label: "Progress", desc: "Log workouts. See your transformation." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <Programs />
        <Testimonials />
        <StoreBanner />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="BODYMESH athlete training"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container-bm relative flex min-h-[90vh] flex-col justify-end pb-16 pt-32 md:min-h-screen md:pb-24">
        <div className="max-w-3xl animate-fade-up">
          <span className="label-eyebrow">// New Season · 2026</span>
          <h1 className="heading-display mt-4 text-balance text-6xl text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
            Active <span className="text-coral italic">Lifestyle.</span>
            <br />Built In Mesh.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            The fitness community behind the activewear. Train with elite coaches,
            compete in weekly challenges, and track every rep alongside athletes
            who move like you.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral hover:opacity-90">
                Join the Community <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/programs">
              <Button size="lg" variant="outline" className="border-foreground/30 bg-background/30 backdrop-blur hover:bg-foreground/10">
                <Play className="mr-2 h-4 w-4" /> Explore Programs
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid max-w-md grid-cols-3 gap-6 text-foreground">
            <Stat value="40K+" label="Athletes" />
            <Stat value="120+" label="Programs" />
            <Stat value="4.9★" label="Rated" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="heading-display text-3xl text-foreground md:text-4xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Marquee() {
  const items = ["Strength", "Endurance", "Mobility", "HIIT", "Recovery", "Mindset", "Nutrition", "Community"];
  return (
    <div className="border-y border-border/60 bg-secondary/40 py-6 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="heading-display mx-8 text-3xl text-muted-foreground md:text-4xl">
            {t} <span className="text-coral">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className="container-bm py-24 md:py-32">
      <div className="mb-16 max-w-2xl">
        <span className="label-eyebrow">// What's inside</span>
        <h2 className="heading-display mt-4 text-balance text-5xl md:text-6xl">
          One ecosystem.<br />Everything you train for.
        </h2>
      </div>
      <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.label} className="group bg-background p-8 transition-smooth hover:bg-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-coral/10 text-coral transition-smooth group-hover:bg-coral group-hover:text-coral-foreground">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="heading-display mt-6 text-2xl">{f.label}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Programs() {
  return (
    <section className="bg-secondary/30 py-24 md:py-32">
      <div className="container-bm">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="label-eyebrow">// Featured Programs</span>
            <h2 className="heading-display mt-4 text-balance text-5xl md:text-6xl">
              Pick a path.<br />Press play.
            </h2>
          </div>
          <Link to="/programs">
            <Button variant="outline" size="lg">
              All programs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map((p) => (
            <article key={p.title} className="group relative overflow-hidden rounded-lg bg-card transition-smooth hover:shadow-elegant">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <Badge className="mb-3 bg-coral text-coral-foreground hover:bg-coral">{p.tag}</Badge>
                <h3 className="heading-display text-2xl text-foreground">{p.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.trainer}</span>
                  <span>{p.weeks}w · {p.level}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Sasha M.", role: "Member · 8 mo", text: "BODYMESH didn't just give me workouts — it gave me a tribe. The leaderboards keep me showing up at 6am." },
    { name: "Daniel K.", role: "Premium · 1 yr", text: "Best programming I've followed. I dropped 9kg and added 30kg to my deadlift in six months." },
    { name: "Priya R.", role: "Member · 4 mo", text: "The community feed is the best part. Real athletes, real progress, zero filter." },
  ];
  return (
    <section className="container-bm py-24 md:py-32">
      <div className="mb-16">
        <span className="label-eyebrow">// Athlete voices</span>
        <h2 className="heading-display mt-4 text-balance text-5xl md:text-6xl">From the inside.</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="rounded-lg bg-gradient-card p-8 ring-1 ring-border">
            <Zap className="h-6 w-6 text-coral" />
            <blockquote className="mt-6 text-lg text-foreground/90">"{t.text}"</blockquote>
            <figcaption className="mt-6 border-t border-border/60 pt-4">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function StoreBanner() {
  return (
    <section className="container-bm pb-24 md:pb-32">
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={storeImg}
          alt="BODYMESH activewear"
          loading="lazy"
          width={1920}
          height={800}
          className="h-[420px] w-full object-cover md:h-[520px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container-bm">
            <div className="max-w-lg">
              <span className="label-eyebrow">// The Gear</span>
              <h2 className="heading-display mt-4 text-balance text-5xl md:text-6xl">
                Shop the gear.<br />Live the lifestyle.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Activewear engineered to move. Members get 10% off every drop.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/store">
                  <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Visit Store
                  </Button>
                </Link>
                <a href="https://bodymesh.shop" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline">bodymesh.shop ↗</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-border/60 bg-secondary/40 py-24 md:py-32">
      <div className="container-bm text-center">
        <span className="label-eyebrow">// Ready?</span>
        <h2 className="heading-display mx-auto mt-4 max-w-3xl text-balance text-5xl md:text-7xl">
          Your training starts the moment you sign up.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral">
              Create your account
            </Button>
          </Link>
          <Link to="/programs">
            <Button size="lg" variant="outline">Browse programs first</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
