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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Difficulty = Database["public"]["Enums"]["difficulty"];
type Program = Database["public"]["Tables"]["programs"]["Row"];

export const Route = createFileRoute("/_admin/admin/programs")({
  head: () => ({ meta: [{ title: "Programs — BODYMESH Admin" }] }),
  component: AdminProgramsPage,
});

function AdminProgramsPage() {
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const programsQ = useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Program deleted");
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onEdit = (p: Program) => {
    setEditing(p);
    setOpenForm(true);
  };
  const onCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-4xl md:text-5xl">Programs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {programsQ.data?.length ?? 0} total
          </p>
        </div>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button onClick={onCreate} className="bg-gradient-coral text-primary-foreground shadow-coral">
              <Plus className="mr-1 h-4 w-4" /> Create
            </Button>
          </DialogTrigger>
          <ProgramFormDialog
            initial={editing}
            onClose={() => setOpenForm(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ["admin-programs"] })}
          />
        </Dialog>
      </div>

      {programsQ.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(programsQ.data ?? []).map((p) => (
            <article key={p.id} className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-coral" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{p.title}</h3>
                  {p.is_premium && (
                    <Badge variant="outline" className="border-sand/40 text-sand">
                      Premium · R{p.price}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {p.category ?? "—"} · {p.duration_weeks}w · {p.difficulty} · by {p.trainer_name ?? "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => onEdit(p)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"? This cannot be undone.`)) del.mutate(p.id);
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

function ProgramFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: Program | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [duration, setDuration] = useState(initial?.duration_weeks ?? 4);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "beginner");
  const [thumb, setThumb] = useState(initial?.thumbnail_url ?? "");
  const [trainerName, setTrainerName] = useState(initial?.trainer_name ?? "");
  const [premium, setPremium] = useState(initial?.is_premium ?? false);
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [stripeId, setStripeId] = useState(initial?.stripe_price_id ?? "");
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
      category: category || null,
      duration_weeks: Number(duration) || 4,
      difficulty,
      thumbnail_url: thumb || null,
      trainer_name: trainerName || null,
      is_premium: premium,
      price: premium ? Number(price) || 0 : 0,
      stripe_price_id: stripeId || null,
    };
    const { error } = initial
      ? await supabase.from("programs").update(payload).eq("id", initial.id)
      : await supabase.from("programs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial ? "Program updated" : "Program created");
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit program" : "Create program"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Iron Foundation" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What this program is about…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Strength" />
          </div>
          <div className="space-y-2">
            <Label>Trainer name</Label>
            <Input value={trainerName} onChange={(e) => setTrainerName(e.target.value)} placeholder="Marco Reyes" />
          </div>
          <div className="space-y-2">
            <Label>Duration (weeks)</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="https://…" />
          {thumb && (
            <img src={thumb} alt="" className="mt-2 h-24 w-full rounded-md object-cover" />
          )}
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label className="cursor-pointer">Premium program</Label>
            <p className="text-xs text-muted-foreground">Members must subscribe to access.</p>
          </div>
          <Switch checked={premium} onCheckedChange={setPremium} />
        </div>
        {premium && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Price (ZAR)</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Payment Price ID</Label>
              <Input value={stripeId} onChange={(e) => setStripeId(e.target.value)} placeholder="optional" />
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving} className="bg-gradient-coral text-primary-foreground">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Save changes" : "Create program"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
