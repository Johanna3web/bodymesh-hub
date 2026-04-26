import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Trophy,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BMLogo } from "@/components/BMLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/programs", label: "Programs", icon: Dumbbell },
  { to: "/admin/challenges", label: "Challenges", icon: Trophy },
  { to: "/admin/community", label: "Community", icon: MessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function AdminLayout() {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      // Render a friendly access-denied screen via the early return below;
      // no automatic redirect so the user understands why.
    }
  }, [loading, isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl bg-card p-8 text-center ring-1 ring-border">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="heading-display mt-5 text-3xl">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need administrator privileges to access this area.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar px-4 py-6 lg:flex">
          <Link to="/" className="px-2">
            <BMLogo />
          </Link>
          <p className="mt-1 px-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            Admin
          </p>
          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-smooth ${
                    active
                      ? "bg-coral/15 text-coral"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link to="/dashboard" className="px-2">
            <Button variant="outline" size="sm" className="w-full">
              <ChevronLeft className="mr-1 h-3 w-3" /> Back to app
            </Button>
          </Link>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
            <div className="lg:hidden">
              <Link to="/" className="inline-flex">
                <BMLogo />
              </Link>
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              BODYMESH Admin
            </div>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Exit admin
              </Button>
            </Link>
          </header>

          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border/60 bg-card/40 px-3 py-2 lg:hidden">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ${
                    active ? "bg-coral text-coral-foreground" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3 w-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
