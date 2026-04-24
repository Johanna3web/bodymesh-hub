import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Twitter } from "lucide-react";
import { BMLogo } from "./BMLogo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container-bm py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BMLogo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The fitness ecosystem behind the activewear. Train. Track. Belong.
            </p>
            <form className="mt-6 flex max-w-sm gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                aria-label="Email"
                className="bg-muted"
              />
              <Button type="submit" className="bg-gradient-coral text-primary-foreground">
                Subscribe
              </Button>
            </form>
          </div>

          <FooterCol title="Train" links={[
            { to: "/programs", label: "Programs" },
            { to: "/challenges", label: "Challenges" },
            { to: "/progress", label: "Progress" },
          ]} />

          <FooterCol title="Community" links={[
            { to: "/community", label: "Feed" },
            { to: "/signup", label: "Join" },
            { to: "/login", label: "Sign in" },
          ]} />

          <FooterCol title="Brand" links={[
            { to: "/store", label: "Shop" },
            { href: "https://bodymesh.shop", label: "bodymesh.shop ↗" },
          ]} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BODYMESH. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-coral transition-smooth"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube" className="hover:text-coral transition-smooth"><Youtube className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-coral transition-smooth"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

type LinkItem = { to?: string; href?: string; label: string };
function FooterCol({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <div>
      <h4 className="label-eyebrow text-foreground">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link to={l.to} className="text-sm text-muted-foreground transition-smooth hover:text-foreground">
                {l.label}
              </Link>
            ) : (
              <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground transition-smooth hover:text-foreground">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
