import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import storeImg from "@/assets/store-banner.jpg";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store — BODYMESH" },
      { name: "description", content: "Shop BODYMESH activewear. Members get 10% off every drop." },
      { property: "og:title", content: "Store — BODYMESH" },
      { property: "og:description", content: "Activewear engineered to move. Visit bodymesh.shop." },
      { property: "og:image", content: "/og-store.jpg" },
    ],
  }),
  component: StorePage,
});

const PRODUCTS = [
  { name: "Mesh Sports Bra", price: "$58", tag: "New" },
  { name: "Espresso Leggings", price: "$84", tag: "Bestseller" },
  { name: "Coral Train Tee", price: "$42", tag: "Limited" },
  { name: "Sand Crewneck", price: "$72", tag: "" },
];

function StorePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <img src={storeImg} alt="BODYMESH activewear" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" width={1920} height={800} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/80 to-background/30" />
          <div className="container-bm py-24 md:py-32">
            <Badge className="bg-coral text-coral-foreground hover:bg-coral">Members 10% off</Badge>
            <h1 className="heading-display mt-4 text-balance text-6xl md:text-8xl">The Store.</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Activewear engineered to move with you. Drop into the full collection at bodymesh.shop.
            </p>
            <a href="https://bodymesh.shop" target="_blank" rel="noreferrer" className="mt-8 inline-block">
              <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral">
                <ShoppingBag className="mr-2 h-4 w-4" /> Visit bodymesh.shop ↗
              </Button>
            </a>
          </div>
        </section>

        <section className="container-bm py-20">
          <h2 className="heading-display mb-10 text-4xl md:text-5xl">Featured drops</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary/40">
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 heading-display text-6xl">
                    //
                  </div>
                  {p.tag && (
                    <Badge className="absolute left-3 top-3 bg-foreground text-background">{p.tag}</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">BODYMESH</p>
                  </div>
                  <span className="text-sm font-semibold text-coral">{p.price}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-secondary/30 py-20">
          <div className="container-bm text-center">
            <h2 className="heading-display text-4xl md:text-5xl">Become a member.<br />Save on every drop.</h2>
            <Link to="/signup" className="mt-6 inline-block">
              <Button size="lg" className="bg-gradient-coral text-primary-foreground shadow-coral">Join free</Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
