import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    // Client-side guard. SSR can't see localStorage session — render the layout
    // and let the inner guard redirect on the client.
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { loading, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  // Onboarding gate
  useEffect(() => {
    if (loading || !isAuthenticated || !profile) return;
    if (!profile.onboarded && location.pathname !== "/onboarding") {
      // Use window.location for simplicity since redirect from effect is fine here
      window.location.replace("/onboarding");
    }
  }, [loading, isAuthenticated, profile, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <SiteHeader />
      <Outlet />
      <MobileTabBar />
    </div>
  );
}
