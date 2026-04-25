import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database["public"]["Enums"]["fitness_goal"];
type Level = Database["public"]["Enums"]["fitness_level"];

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — BODYMESH" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh, roles } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState<Goal>("muscle_gain");
  const [level, setLevel] = useState<Level>("beginner");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    if (profile.fitness_goal) setGoal(profile.fitness_goal);
    if (profile.fitness_level) setLevel(profile.fitness_level);
  }, [profile]);

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
    setUploading(false);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    await refresh();
    toast.success("Avatar updated");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        fitness_goal: goal,
        fitness_level: level,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile saved");
  };

  return (
    <main className="container-bm py-10 md:py-16">
      <div>
        <span className="label-eyebrow">// You</span>
        <h1 className="heading-display mt-2 text-5xl md:text-6xl">Profile</h1>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl bg-card p-6 ring-1 ring-border">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="Avatar" />
              <AvatarFallback className="bg-coral/15 text-lg text-coral">{initials}</AvatarFallback>
            </Avatar>
            <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
              {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
            </label>
            <p className="mt-4 text-sm font-semibold">{profile?.full_name || "Athlete"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {roles.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px] uppercase">{r}</Badge>
              ))}
            </div>
            <div className="mt-6 grid w-full grid-cols-2 gap-2">
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="text-lg font-semibold">{profile?.points ?? 0}</div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Plan</div>
                <div className="text-sm font-semibold capitalize">{profile?.subscription_status ?? "free"}</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-6 rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fitness goal</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["weight_loss", "muscle_gain", "endurance", "lifestyle"] as Goal[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`rounded-md border px-3 py-2 text-xs font-medium capitalize transition-smooth ${
                      goal === g ? "border-coral bg-coral/10 text-coral" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fitness level</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["beginner", "intermediate", "advanced"] as Level[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`rounded-md border px-3 py-2 text-xs font-medium capitalize transition-smooth ${
                      level === l ? "border-coral bg-coral/10 text-coral" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-coral text-primary-foreground shadow-coral">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
