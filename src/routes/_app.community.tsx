import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, ImagePlus, Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_app/community")({
  head: () => ({
    meta: [
      { title: "Community — BODYMESH" },
      { name: "description", content: "Share your training, transformations, and motivation." },
    ],
  }),
  component: CommunityPage,
});

const PAGE_SIZE = 10;
const TYPES = [
  { value: "all", label: "All" },
  { value: "program", label: "Programs" },
  { value: "transformation", label: "Transformations" },
  { value: "challenge", label: "Challenges" },
] as const;

type Profile = { full_name: string | null; avatar_url: string | null };
type Post = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  likes_count: number;
  post_type: string;
  profiles: Profile | null;
};

function CommunityPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<typeof TYPES[number]["value"]>("all");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"general" | "program" | "transformation" | "challenge">("general");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const feed = useInfiniteQuery({
    queryKey: ["community", filter],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("community_posts")
        .select("id, content, image_url, created_at, user_id, likes_count, post_type, profiles:user_id(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (filter !== "all") q = q.eq("post_type", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Post[];
    },
    getNextPageParam: (last, all) => (last.length < PAGE_SIZE ? undefined : all.length),
  });

  const myLikesQ = useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("post_likes").select("post_id").eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.post_id));
    },
  });
  const liked = myLikesQ.data ?? new Set<string>();

  const submit = async () => {
    if (!user) return;
    const text = content.trim();
    if (!text) {
      toast.error("Write something first");
      return;
    }
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("community").upload(path, image);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("community").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        content: text,
        image_url: imageUrl,
        post_type: postType,
      });
      if (error) throw error;
      setContent("");
      setImage(null);
      qc.invalidateQueries({ queryKey: ["community"] });
      toast.success("Posted!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Sign in required");
      if (liked.has(postId)) {
        await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
        const { data: p } = await supabase.from("community_posts").select("likes_count").eq("id", postId).maybeSingle();
        if (p) await supabase.from("community_posts").update({ likes_count: Math.max(0, p.likes_count - 1) }).eq("id", postId);
      } else {
        await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId });
        const { data: p } = await supabase.from("community_posts").select("likes_count").eq("id", postId).maybeSingle();
        if (p) await supabase.from("community_posts").update({ likes_count: p.likes_count + 1 }).eq("id", postId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community"] });
      qc.invalidateQueries({ queryKey: ["my-likes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allPosts = (feed.data?.pages ?? []).flat();

  return (
    <main className="container-bm py-10 md:py-16">
      <div>
        <span className="label-eyebrow">// Community</span>
        <h1 className="heading-display mt-2 text-5xl md:text-6xl">The feed</h1>
        <p className="mt-2 text-muted-foreground">Athletes pushing each other forward.</p>
      </div>

      {/* Composer */}
      <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="bg-coral/15 text-xs text-coral">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's your win today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            {image ? (
              <p className="mt-2 text-xs text-muted-foreground">📎 {image.name}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent">
                  <ImagePlus className="h-3.5 w-3.5" /> Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as typeof postType)}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                >
                  <option value="general">General</option>
                  <option value="program">Program</option>
                  <option value="transformation">Transformation</option>
                  <option value="challenge">Challenge</option>
                </select>
              </div>
              <Button onClick={submit} disabled={posting} className="bg-gradient-coral text-primary-foreground shadow-coral">
                {posting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mt-8">
        <TabsList>
          {TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {feed.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
        ) : allPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg font-semibold">Be the first to share your journey! 💪</p>
            <p className="mt-1 text-sm text-muted-foreground">Your post could be the spark someone needs today.</p>
          </div>
        ) : (
          allPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              isLiked={liked.has(p.id)}
              onLike={() => toggleLike.mutate(p.id)}
              isCommentOpen={openComments === p.id}
              onToggleComments={() => setOpenComments((v) => (v === p.id ? null : p.id))}
              currentUserId={user?.id}
              onDeleted={() => qc.invalidateQueries({ queryKey: ["community"] })}
            />
          ))
        )}

        {feed.hasNextPage ? (
          <div className="pt-4 text-center">
            <Button variant="outline" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
              {feed.isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function PostCard({
  post, isLiked, onLike, isCommentOpen, onToggleComments, currentUserId, onDeleted,
}: {
  post: Post;
  isLiked: boolean;
  onLike: () => void;
  isCommentOpen: boolean;
  onToggleComments: () => void;
  currentUserId?: string;
  onDeleted: () => void;
}) {
  const initials = (post.profiles?.full_name ?? "?").slice(0, 2).toUpperCase();
  const ownPost = currentUserId === post.user_id;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", post.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      onDeleted();
    }
  };

  return (
    <article className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="bg-coral/15 text-xs text-coral">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{post.profiles?.full_name ?? "Athlete"}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgo(post.created_at)} · {post.post_type}</p>
          </div>
        </div>
        {ownPost ? (
          <button onClick={handleDelete} aria-label="Delete post" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </header>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.content}</p>
      {post.image_url ? (
        <img src={post.image_url} alt="" className="mt-3 w-full rounded-xl object-cover" />
      ) : null}

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
        <button onClick={onLike} className={`inline-flex items-center gap-1.5 transition-smooth ${isLiked ? "text-coral" : "text-muted-foreground hover:text-foreground"}`}>
          <Heart className={`h-4 w-4 ${isLiked ? "fill-coral" : ""}`} /> {post.likes_count}
        </button>
        <button onClick={onToggleComments} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-4 w-4" /> Comments
        </button>
      </div>

      {isCommentOpen ? <CommentThread postId={post.id} /> : null}
    </article>
  );
}

function CommentThread({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const q = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, profiles:user_id(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !text.trim()) return;
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim(),
      });
      if (error) throw error;
      setText("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const initials = (profile?.full_name ?? user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="mt-4 rounded-xl bg-muted/40 p-4">
      <div className="space-y-3">
        {q.isLoading ? <Skeleton className="h-12" /> : (q.data ?? []).map((c) => {
          const prof = (c as unknown as { profiles: Profile | null }).profiles;
          return (
            <div key={c.id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={prof?.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="bg-coral/15 text-[10px] text-coral">
                  {(prof?.full_name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-xs font-semibold">{prof?.full_name ?? "Athlete"}</p>
                <p className="text-sm">{c.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="bg-coral/15 text-[10px] text-coral">{initials}</AvatarFallback>
        </Avatar>
        <Textarea
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          className="min-h-[40px] flex-1 resize-none"
        />
        <Button size="sm" onClick={() => submit.mutate()} disabled={submit.isPending || !text.trim()}>
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
