import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_admin/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — BODYMESH Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const signups = useQuery({
    queryKey: ["analytics-signups"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Bucket per day for last 30 days.
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      (data ?? []).forEach((row) => {
        const key = row.created_at.slice(0, 10);
        if (key in buckets) buckets[key]++;
      });
      return Object.entries(buckets).map(([date, count]) => ({
        date: date.slice(5),
        count,
      }));
    },
  });

  const enrollments = useQuery({
    queryKey: ["analytics-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_programs")
        .select("program_id, programs:program_id(title)");
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => {
        const title = (r.programs as { title?: string } | null)?.title ?? "—";
        counts.set(title, (counts.get(title) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  const premiumStats = useQuery({
    queryKey: ["analytics-premium"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "premium");
      return { active: count ?? 0 };
    },
  });

  const totalSignups = (signups.data ?? []).reduce((s, r) => s + r.count, 0);
  const totalEnrollments = (enrollments.data ?? []).reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-display text-4xl md:text-5xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days of activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Signups (30d)" value={totalSignups.toLocaleString()} />
        <Stat label="Total enrollments" value={totalEnrollments.toLocaleString()} />
        <Stat
          label="Active premium"
          value={(premiumStats.data?.active ?? 0).toLocaleString()}
          icon={<Crown className="h-4 w-4 text-coral" />}
        />
      </div>

      <section className="rounded-xl bg-card p-5 ring-1 ring-border">
        <h2 className="heading-display text-xl">Signups per day</h2>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
        {signups.isLoading ? (
          <Skeleton className="mt-4 h-64" />
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signups.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 40)" />
                <XAxis dataKey="date" stroke="oklch(0.65 0.02 60)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="oklch(0.65 0.02 60)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.02 40)",
                    border: "1px solid oklch(0.25 0.02 40)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "oklch(0.95 0.015 75)" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="oklch(0.72 0.16 35)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-border">
        <h2 className="heading-display text-xl">Enrollments by program</h2>
        {enrollments.isLoading ? (
          <Skeleton className="mt-4 h-64" />
        ) : (enrollments.data ?? []).length === 0 ? (
          <p className="mt-4 py-12 text-center text-sm text-muted-foreground">No enrollments yet.</p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollments.data} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 40)" />
                <XAxis type="number" allowDecimals={false} stroke="oklch(0.65 0.02 60)" fontSize={11} />
                <YAxis dataKey="title" type="category" stroke="oklch(0.65 0.02 60)" fontSize={11} width={140} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.02 40)",
                    border: "1px solid oklch(0.25 0.02 40)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.72 0.16 35)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Revenue analytics will appear here once payment processing is connected.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}
