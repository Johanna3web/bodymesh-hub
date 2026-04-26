import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/overview" });
    }
  },
  component: () => <Outlet />,
});
