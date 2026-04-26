ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS flag_count integer NOT NULL DEFAULT 0;