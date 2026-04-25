import { Link, useLocation } from "@tanstack/react-router";
import { Home, Dumbbell, Users, User } from "lucide-react";

const ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/programs", label: "Programs", icon: Dumbbell },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-smooth ${
                  active ? "text-coral" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
