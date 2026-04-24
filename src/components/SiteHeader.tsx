import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BMLogo } from "./BMLogo";
import { Button } from "./ui/button";

const NAV = [
  { to: "/programs", label: "Programs" },
  { to: "/challenges", label: "Challenges" },
  { to: "/community", label: "Community" },
  { to: "/store", label: "Store" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-bm flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center" aria-label="BODYMESH home">
          <BMLogo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-gradient-coral text-primary-foreground shadow-coral hover:opacity-90">
              Join
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="container-bm flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3 border-t border-border/60 pt-4">
              <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Log in</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                <Button className="w-full bg-gradient-coral text-primary-foreground">Join</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
