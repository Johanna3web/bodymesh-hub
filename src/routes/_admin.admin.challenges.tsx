import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Challenge = Database["public"]["Tables"]["challenges"]["Row"];

export const Route = createFileRoute("/_admin/admin/challenges")({
  head: () => ({ meta: [{ title: "Challenges — BODYMESH Admin" }] }),
  component: AdminChallengesPage,
});

function AdminChallengesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);

  const q = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("start_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Challenge deleted");
      qc.invalidateQueries({ queryKey: ["admin-challenges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-4xl md:text-5xl">Challenges</h1>
          <p className="mt-1 text-sm text-muted-foreground">{q.data?.length ?? 0} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="bg-gradient-coral text-primary-foreground shadow-coral"
            >
              <Plus className="mr-1 h-4 w-4" /> Create
            </Button>
          </DialogTrigger>
          <ChallengeForm
            initial={editing}
            onClose={() => setOpen(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ["admin-challenges"] })}
          />
        </Dialog>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((c) => (
            <article key={c.id} className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {c.thumbnail_url ? (
                  <img src={c.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-coral" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{c.title}</h3>
                  {c.is_premium && (
                    <Badge variant="outline" className="border-sand/40 text-sand">
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.start_date ?? "—"} → {c.end_date ?? "—"} · {c.reward_points} pts
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditing(c);
                    setOpen(true);
                  }}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id);
                  }}
                  aria-label="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Challenge | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [thumb, setThumb] = useState(initial?.thumbnail_url ?? "");
  const [start, setStart] = useState(initial?.start_date ?? "");
  const [end, setEnd] = useState(initial?.end_date ?? "");
  const [points, setPoints] = useState(initial?.reward_points ?? 100);
  const [badge, setBadge] = useState(initial?.reward_badge ?? "");
  const [premium, setPremium] = useState(initial?.is_premium ?? false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description || null,
      thumbnail_url: thumb || null,
      start_date: start || null,
      end_date: end || null,
      reward_points: Number(points) || 0,
      reward_badge: badge || null,
      is_premium: premium,
    };
    const { error } = initial
      ? await supabase.from("challenges").update(payload).eq("id", initial.id)
      : await supabase.from("challenges").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial ? "Challenge updated" : "Challenge created");
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit challenge" : "Create challenge"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={start ?? ""} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <Input type="date" value={end ?? ""} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reward points</Label>
            <Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Reward badge</Label>
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Iron Will" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label>Premium-only</Label>
            <p className="text-xs text-muted-foreground">Hide from free members.</p>
          </div>
          <Switch checked={premium} onCheckedChange={setPremium} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving} className="bg-gradient-coral text-primary-foreground">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Save changes" : "Create challenge"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
