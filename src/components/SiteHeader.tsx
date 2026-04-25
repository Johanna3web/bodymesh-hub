import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard, TrendingUp } from "lucide-react";
import { BMLogo } from "./BMLogo";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { NotificationsBell } from "./NotificationsBell";

const NAV = [
  { to: "/programs", label: "Programs" },
  { to: "/challenges", label: "Challenges" },
  { to: "/community", label: "Community" },
  { to: "/store", label: "Store" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials =
    (profile?.full_name || user?.email || "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

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
          {isAuthenticated ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full ring-1 ring-border transition-smooth hover:ring-foreground/40">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? "Profile"} />
                    <AvatarFallback className="bg-coral/15 text-xs font-semibold text-coral">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || "Athlete"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/progress" })}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Progress
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
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
            </>
          )}
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
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button
                    className="flex-1 bg-gradient-coral text-primary-foreground"
                    onClick={() => {
                      setOpen(false);
                      void handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-gradient-coral text-primary-foreground">Join</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
