
-- ============================================================
-- BODYMESH schema, roles, RLS, triggers
-- ============================================================

-- Enums
CREATE TYPE public.app_role AS ENUM ('member', 'premium', 'trainer', 'admin');
CREATE TYPE public.fitness_goal AS ENUM ('weight_loss', 'muscle_gain', 'endurance', 'lifestyle');
CREATE TYPE public.fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Profiles (no role here — roles in separate user_roles table)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  fitness_goal public.fitness_goal,
  fitness_level public.fitness_level,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  points INTEGER NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles (separate to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Programs
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trainer_name TEXT,
  thumbnail_url TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  difficulty public.difficulty NOT NULL DEFAULT 'beginner',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_mins INTEGER NOT NULL DEFAULT 30,
  order_index INTEGER NOT NULL DEFAULT 1,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User -> Program enrollments
CREATE TABLE public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_workouts INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, program_id)
);

-- Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  reward_points INTEGER NOT NULL DEFAULT 100,
  reward_badge TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenge entries
CREATE TABLE public.challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Community posts
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'general',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progress logs
CREATE TABLE public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_mins INTEGER,
  notes TEXT
);

-- Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Auto-create profile + default member role on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, fitness_goal)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'fitness_goal','')::public.fitness_goal
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- profiles: anyone authed can read; users update own; admins all
CREATE POLICY "Profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles: users see own; only admins write
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- programs: readable by everyone (public marketing); trainers/admins write
CREATE POLICY "Programs readable by all" ON public.programs
  FOR SELECT USING (true);
CREATE POLICY "Trainers create programs" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Trainers update own programs" ON public.programs
  FOR UPDATE TO authenticated USING (
    trainer_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "Admins delete programs" ON public.programs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- workouts: readable by all; trainers/admins write
CREATE POLICY "Workouts readable by all" ON public.workouts
  FOR SELECT USING (true);
CREATE POLICY "Trainers manage workouts" ON public.workouts
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin')
  ) WITH CHECK (
    public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'admin')
  );

-- user_programs: own only; admins all
CREATE POLICY "View own enrollments" ON public.user_programs
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert own enrollment" ON public.user_programs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own enrollment" ON public.user_programs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own enrollment" ON public.user_programs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- challenges: readable by authenticated; admins write
CREATE POLICY "Challenges readable by authed" ON public.challenges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage challenges" ON public.challenges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- challenge_entries: own
CREATE POLICY "View own challenge entries" ON public.challenge_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Leaderboard read" ON public.challenge_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own challenge entry" ON public.challenge_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own challenge entry" ON public.challenge_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- community_posts: readable by authed; users own writes
CREATE POLICY "Posts readable" ON public.community_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own post" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own post" ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own post" ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- post_likes
CREATE POLICY "Likes readable" ON public.post_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own like" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own like" ON public.post_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments
CREATE POLICY "Comments readable" ON public.comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own comment" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own comment" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own comment" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- progress_logs: own only
CREATE POLICY "View own progress" ON public.progress_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Insert own progress" ON public.progress_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own progress" ON public.progress_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- badges: readable by all; admins write
CREATE POLICY "Badges readable" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON public.badges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_badges
CREATE POLICY "View own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public badge counts" ON public.user_badges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins grant badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- notifications: own
CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for avatars and progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('progress', 'progress', false)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('community', 'community', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own progress photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'progress' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users upload own progress photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'progress' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public community media read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community');
CREATE POLICY "Users upload community media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'community' AND auth.uid()::text = (storage.foldername(name))[1]
  );
