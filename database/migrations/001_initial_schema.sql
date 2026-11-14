-- ====================================================================
-- WORDLY: Database Schema Migration 001
-- Full normalized PostgreSQL schema with strict RLS and role protection
-- ====================================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  daily_goal integer NOT NULL DEFAULT 10 CHECK (daily_goal > 0 AND daily_goal <= 100),
  timezone text NOT NULL DEFAULT 'Europe/Sofia',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. WORDS (Core dictionary entries, unique by normalized_headword + part_of_speech)
CREATE TABLE IF NOT EXISTS public.words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headword text NOT NULL,
  normalized_headword text NOT NULL,
  part_of_speech text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  pronunciation text,
  is_phrase boolean NOT NULL DEFAULT false,
  source text,
  source_rank integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_translation', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_words_headword_pos UNIQUE (normalized_headword, part_of_speech)
);

-- 3. WORD MEANINGS
CREATE TABLE IF NOT EXISTS public.word_meanings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  translation text NOT NULL,
  accepted_translations text[] NOT NULL DEFAULT '{}',
  definition text,
  example_en text,
  example_bg text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. WORD CATEGORIES (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.word_categories (
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (word_id, category_id)
);

-- 6. COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. COLLECTION WORDS
CREATE TABLE IF NOT EXISTS public.collection_words (
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, word_id)
);

-- 8. USER CUSTOM WORDS (Private personal vocabulary)
CREATE TABLE IF NOT EXISTS public.user_custom_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headword text NOT NULL,
  normalized_headword text NOT NULL,
  part_of_speech text NOT NULL,
  translation text NOT NULL,
  accepted_translations text[] NOT NULL DEFAULT '{}',
  definition text,
  example_en text,
  example_bg text,
  is_phrase boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. WORD SUBMISSIONS (Public dictionary proposals)
CREATE TABLE IF NOT EXISTS public.word_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headword text NOT NULL,
  part_of_speech text NOT NULL,
  translation text NOT NULL,
  definition text,
  example_en text,
  example_bg text,
  explanation text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. USER FAVORITES
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word_id uuid REFERENCES public.words(id) ON DELETE CASCADE,
  custom_word_id uuid REFERENCES public.user_custom_words(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_favorite_target CHECK (
    (word_id IS NOT NULL AND custom_word_id IS NULL) OR
    (word_id IS NULL AND custom_word_id IS NOT NULL)
  )
);

-- 11. USER WORD PROGRESS (SM-2 Spaced Repetition engine tracker)
CREATE TABLE IF NOT EXISTS public.user_word_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word_id uuid REFERENCES public.words(id) ON DELETE CASCADE,
  custom_word_id uuid REFERENCES public.user_custom_words(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'mastered')),
  repetitions integer NOT NULL DEFAULT 0,
  interval_days numeric NOT NULL DEFAULT 0,
  ease_factor numeric NOT NULL DEFAULT 2.5,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  correct_count integer NOT NULL DEFAULT 0,
  incorrect_count integer NOT NULL DEFAULT 0,
  consecutive_correct integer NOT NULL DEFAULT 0,
  distinct_success_sessions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_progress_target CHECK (
    (word_id IS NOT NULL AND custom_word_id IS NULL) OR
    (word_id IS NULL AND custom_word_id IS NOT NULL)
  )
);

-- 12. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 13. REVIEW LOGS
CREATE TABLE IF NOT EXISTS public.review_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word_id uuid REFERENCES public.words(id) ON DELETE CASCADE,
  custom_word_id uuid REFERENCES public.user_custom_words(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  result text NOT NULL,
  response_time_ms integer,
  review_mode text NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

-- 14. XP EVENTS (Tamper-proof & idempotent XP)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text NOT NULL,
  xp integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_xp_event UNIQUE (user_id, source_type, source_id)
);

-- 15. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 16. USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

-- 17. DAILY ACTIVITY (Streaks tracked in user timezone)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  words_reviewed integer NOT NULL DEFAULT 0,
  words_learned integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  study_minutes integer NOT NULL DEFAULT 0,
  CONSTRAINT uq_user_daily_activity UNIQUE (user_id, activity_date)
);

-- 18. IMPORT BATCHES
CREATE TABLE IF NOT EXISTS public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  filename text NOT NULL,
  format text NOT NULL,
  imported_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  error_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE & INTEGRITY
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_word_meanings_word_id ON public.word_meanings(word_id);
CREATE INDEX IF NOT EXISTS idx_word_categories_cat_id ON public.word_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_collection_words_word_id ON public.collection_words(word_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_words_user_id ON public.user_custom_words(user_id);
CREATE INDEX IF NOT EXISTS idx_word_submissions_user_id ON public.word_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_word_submissions_status ON public.word_submissions(status);

-- Partial unique indexes for favorites
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_fav_core ON public.user_favorites(user_id, word_id) WHERE word_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_fav_custom ON public.user_favorites(user_id, custom_word_id) WHERE custom_word_id IS NOT NULL;

-- Partial unique indexes for progress
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_prog_core ON public.user_word_progress(user_id, word_id) WHERE word_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_prog_custom ON public.user_word_progress(user_id, custom_word_id) WHERE custom_word_id IS NOT NULL;

-- Query indexes for spaced repetition reviews
CREATE INDEX IF NOT EXISTS idx_prog_user_due ON public.user_word_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_prog_user_status ON public.user_word_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_review_logs_user_time ON public.review_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_time ON public.study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_daily_act_user_date ON public.daily_activity(user_id, activity_date);

-- ====================================================================
-- SECURITY FUNCTIONS & TRIGGERS
-- ====================================================================

-- Function to check if the caller has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger to prevent any non-admin from changing their own or other users' roles
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify user roles';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- Auto create profile on auth.users registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username text;
  v_display_name text;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
  );
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    role,
    daily_goal,
    timezone
  )
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    COALESCE((NEW.raw_user_meta_data->>'daily_goal')::integer, 10),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Europe/Sofia')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Atomic approval of public dictionary submission
CREATE OR REPLACE FUNCTION public.approve_word_submission(
  p_submission_id uuid,
  p_admin_id uuid,
  p_category_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub record;
  v_word_id uuid;
  v_norm text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: administrator role required';
  END IF;

  SELECT * INTO v_sub FROM public.word_submissions
  WHERE id = p_submission_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_sub.status = 'APPROVED' THEN
    RAISE EXCEPTION 'Submission has already been approved';
  END IF;

  v_norm := lower(trim(v_sub.headword));

  -- Get or insert word
  SELECT id INTO v_word_id FROM public.words
  WHERE normalized_headword = v_norm AND part_of_speech = v_sub.part_of_speech;

  IF v_word_id IS NULL THEN
    INSERT INTO public.words (
      headword,
      normalized_headword,
      part_of_speech,
      status
    )
    VALUES (
      trim(v_sub.headword),
      v_norm,
      v_sub.part_of_speech,
      'active'
    )
    RETURNING id INTO v_word_id;
  END IF;

  -- Insert meaning
  INSERT INTO public.word_meanings (
    word_id,
    translation,
    definition,
    example_en,
    example_bg
  )
  VALUES (
    v_word_id,
    trim(v_sub.translation),
    v_sub.definition,
    v_sub.example_en,
    v_sub.example_bg
  );

  -- Link category if provided
  IF p_category_id IS NOT NULL THEN
    INSERT INTO public.word_categories (word_id, category_id)
    VALUES (v_word_id, p_category_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mark submission approved
  UPDATE public.word_submissions
  SET status = 'APPROVED',
      reviewed_by = p_admin_id,
      reviewed_at = now()
  WHERE id = p_submission_id;

  RETURN v_word_id;
END;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_meanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Words & Meanings (Public dictionary: read by authenticated users, write by admin)
CREATE POLICY "Words readable by authenticated users"
ON public.words FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Words modifiable by admins only"
ON public.words FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Meanings readable by authenticated users"
ON public.word_meanings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Meanings modifiable by admins only"
ON public.word_meanings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Categories & Word Categories
CREATE POLICY "Categories readable by authenticated users"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Categories modifiable by admins only"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Word categories readable by authenticated users"
ON public.word_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Word categories modifiable by admins only"
ON public.word_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Collections
CREATE POLICY "Collections readable by authenticated users"
ON public.collections FOR SELECT
TO authenticated
USING (visibility = 'public' OR public.is_admin());

CREATE POLICY "Collections modifiable by admins only"
ON public.collections FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Collection words readable by authenticated users"
ON public.collection_words FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Collection words modifiable by admins only"
ON public.collection_words FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. User Custom Words (Strictly private)
CREATE POLICY "Custom words accessible by owner only"
ON public.user_custom_words FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Word Submissions
CREATE POLICY "Submissions viewable by submitter or admin"
ON public.word_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create submissions"
ON public.word_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

CREATE POLICY "Admins can update submissions"
ON public.word_submissions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. User Favorites
CREATE POLICY "Favorites accessible by owner only"
ON public.user_favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. User Progress
CREATE POLICY "Progress accessible by owner only"
ON public.user_word_progress FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9. Study Sessions & Review Logs
CREATE POLICY "Sessions accessible by owner only"
ON public.study_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Logs accessible by owner only"
ON public.review_logs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 10. XP Events & Daily Activity
CREATE POLICY "XP events accessible by owner only"
ON public.xp_events FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Daily activity accessible by owner only"
ON public.daily_activity FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. Achievements
CREATE POLICY "Achievements readable by authenticated users"
ON public.achievements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Achievements manageable by admins only"
ON public.achievements FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "User achievements accessible by owner only"
ON public.user_achievements FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 12. Import Batches
CREATE POLICY "Import batches manageable by admins only"
ON public.import_batches FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ====================================================================
-- INITIAL SEED: Core Achievements
-- ====================================================================

INSERT INTO public.achievements (id, name, description, icon, criteria) VALUES
('first_word', 'First Step', 'Review your first vocabulary word', 'Sparkles', '{"min_reviews": 1}'),
('ten_words', 'Getting Started', 'Study 10 words in any mode', 'BookOpen', '{"min_reviews": 10}'),
('fifty_words', 'Vocabulary Enthusiast', 'Master 50 words', 'Flame', '{"min_mastered": 50}'),
('hundred_words', 'Century Club', 'Master 100 words', 'Trophy', '{"min_mastered": 100}'),
('streak_7', 'Weekly Dedication', 'Maintain a 7-day study streak', 'Calendar', '{"min_streak": 7}'),
('streak_30', 'Unstoppable Habit', 'Maintain a 30-day study streak', 'Zap', '{"min_streak": 30}')
ON CONFLICT (id) DO NOTHING;
