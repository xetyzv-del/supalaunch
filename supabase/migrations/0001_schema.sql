-- ==============================================================================
-- CivilEdge IAS — Complete Supabase PostgreSQL Schema (Option A)
-- Includes: 10 Core Tables, RLS Policies, RBAC, RPCs, Triggers, and Realtime
-- ==============================================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  target_year TEXT NOT NULL DEFAULT '2026',
  optional_subject TEXT NOT NULL DEFAULT 'Public Administration',
  streak_days INTEGER NOT NULL DEFAULT 1,
  study_minutes INTEGER NOT NULL DEFAULT 0,
  target_minutes INTEGER NOT NULL DEFAULT 120,
  role TEXT NOT NULL DEFAULT 'aspirant' CHECK (role IN ('aspirant', 'mentor', 'admin')),
  last_study_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Broadcast Classes (Studio Seminars & Timetable)
CREATE TABLE IF NOT EXISTS public.broadcast_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  faculty TEXT NOT NULL,
  faculty_designation TEXT,
  source TEXT NOT NULL CHECK (source IN ('youtube', 'meet', 'zoom', 'hls', 'vimeo', 'custom')),
  stream_url TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('live', 'scheduled', 'completed')),
  description TEXT,
  topics_covered TEXT[] DEFAULT '{}',
  handout_url TEXT,
  handout_title TEXT,
  thumbnail TEXT,
  viewers_count INTEGER DEFAULT 0,
  meeting_id TEXT,
  meeting_password TEXT,
  chat_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Lecture Doubts (Live Classroom Q&A)
CREATE TABLE IF NOT EXISTS public.lecture_doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  query TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  faculty_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Lecture Notes (Timestamped Study Notes)
CREATE TABLE IF NOT EXISTS public.lecture_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcast_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  formatted_time TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Quiz Questions (Bilingual Prelims MCQs)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  gs_paper TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_hi TEXT NOT NULL,
  statements_en TEXT[] DEFAULT '{}',
  statements_hi TEXT[] DEFAULT '{}',
  options_en TEXT[] NOT NULL,
  options_hi TEXT[] NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation_en TEXT NOT NULL,
  explanation_hi TEXT NOT NULL,
  source_book TEXT NOT NULL DEFAULT 'CivilEdge Faculty Bank',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Quizzes (Prelims Test Series & Drills)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  gs_paper TEXT NOT NULL,
  subject TEXT NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'topic_quiz' CHECK (test_type IN ('mock_test', 'mcq_drill', 'topic_quiz')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Test Attempts (Scorecards & Diagnostics)
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  test_title TEXT NOT NULL,
  score NUMERIC(6, 2) NOT NULL,
  max_marks INTEGER NOT NULL,
  accuracy NUMERIC(5, 2) NOT NULL,
  percentile NUMERIC(5, 2),
  correct INTEGER NOT NULL,
  incorrect INTEGER NOT NULL,
  unattempted INTEGER NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  subject_wise JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Mains Questions (Daily Answer Writing Lab)
CREATE TABLE IF NOT EXISTS public.mains_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  gs_paper TEXT NOT NULL,
  subject TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 15,
  word_limit INTEGER NOT NULL DEFAULT 250,
  prompt TEXT NOT NULL,
  suggested_time_min INTEGER NOT NULL DEFAULT 11,
  framework JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_answer_snippet TEXT NOT NULL DEFAULT '',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Mains Submissions (Aspirant Submissions & AI Evaluations)
CREATE TABLE IF NOT EXISTS public.mains_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.mains_questions(id) ON DELETE CASCADE,
  question_prompt TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'evaluated' CHECK (status IN ('pending', 'evaluated', 'failed')),
  score NUMERIC(5, 2),
  max_marks INTEGER NOT NULL DEFAULT 15,
  feedback TEXT NOT NULL DEFAULT '',
  evaluation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Resources (Academic Compendiums & Handouts)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ncert', 'standard', 'yojana', 'pib', 'pyq', 'user')),
  gs_paper TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'jpg', 'epub')),
  size_bytes BIGINT NOT NULL DEFAULT 1024,
  pages INTEGER,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3, 1) NOT NULL DEFAULT 4.8,
  author_or_source TEXT NOT NULL,
  summary TEXT NOT NULL,
  topics_covered TEXT[] DEFAULT '{}',
  file_path TEXT,
  is_user_uploaded BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Topics of the Day (Crux Feed)
CREATE TABLE IF NOT EXISTS public.topics_of_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time_minutes INTEGER NOT NULL DEFAULT 7,
  gs_paper TEXT NOT NULL,
  summary_bullets TEXT[] DEFAULT '{}',
  key_articles_or_data JSONB DEFAULT '[]'::jsonb,
  mindmap_nodes JSONB DEFAULT '[]'::jsonb,
  pdf_brief_name TEXT NOT NULL,
  pdf_brief_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Syllabus Progress
CREATE TABLE IF NOT EXISTS public.syllabus_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtopic_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subtopic_id)
);

-- Preserve older lecture rows while adding ownership for new authenticated records.
ALTER TABLE public.lecture_doubts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lecture_notes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lecture_doubts' AND column_name = 'avatar_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lecture_doubts' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE public.lecture_doubts RENAME COLUMN avatar_url TO avatar;
  END IF;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mains_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics_of_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read; users update their own
DROP POLICY IF EXISTS "Public profiles are viewable by all authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by all authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Broadcasts: Public read; staff manage
DROP POLICY IF EXISTS "Broadcasts viewable by anyone" ON public.broadcast_classes;
CREATE POLICY "Broadcasts viewable by anyone"
  ON public.broadcast_classes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Faculty can insert broadcasts" ON public.broadcast_classes;
CREATE POLICY "Faculty can insert broadcasts"
  ON public.broadcast_classes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );

DROP POLICY IF EXISTS "Faculty can update broadcasts" ON public.broadcast_classes;
CREATE POLICY "Faculty can update broadcasts"
  ON public.broadcast_classes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );

-- Lecture Doubts: Public read; authenticated users post; owners update
DROP POLICY IF EXISTS "Doubts viewable by all" ON public.lecture_doubts;
CREATE POLICY "Doubts viewable by all"
  ON public.lecture_doubts FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Authenticated users can post doubts" ON public.lecture_doubts;
CREATE POLICY "Authenticated users can post doubts"
  ON public.lecture_doubts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lecture Notes: Private to owner
DROP POLICY IF EXISTS "Users manage their own lecture notes" ON public.lecture_notes;
CREATE POLICY "Users manage their own lecture notes"
  ON public.lecture_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quizzes & Questions: Public read
DROP POLICY IF EXISTS "Quizzes readable by everyone" ON public.quizzes;
CREATE POLICY "Quizzes readable by everyone"
  ON public.quizzes FOR SELECT TO authenticated, anon USING (is_published = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Questions readable by everyone" ON public.quiz_questions;
CREATE POLICY "Questions readable by everyone"
  ON public.quiz_questions FOR SELECT TO authenticated, anon USING (true);

-- Test Attempts: Private to owner
DROP POLICY IF EXISTS "Users view and insert their own attempts" ON public.test_attempts;
CREATE POLICY "Users view and insert their own attempts"
  ON public.test_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mains Questions & Submissions
DROP POLICY IF EXISTS "Mains questions viewable by all" ON public.mains_questions;
CREATE POLICY "Mains questions viewable by all"
  ON public.mains_questions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users view and insert their own mains submissions" ON public.mains_submissions;
CREATE POLICY "Users view and insert their own mains submissions"
  ON public.mains_submissions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Resources: Public read approved; staff view all
DROP POLICY IF EXISTS "Approved resources readable by all" ON public.resources;
CREATE POLICY "Approved resources readable by all"
  ON public.resources FOR SELECT TO authenticated, anon
  USING (
    moderation_status = 'approved' OR
    auth.uid() = uploaded_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'mentor'))
  );

-- Topics of the day: Public read
DROP POLICY IF EXISTS "Topics readable by all" ON public.topics_of_day;
CREATE POLICY "Topics readable by all"
  ON public.topics_of_day FOR SELECT TO authenticated, anon USING (true);

-- Syllabus Progress: Private to owner
DROP POLICY IF EXISTS "Users manage their syllabus progress" ON public.syllabus_progress;
CREATE POLICY "Users manage their syllabus progress"
  ON public.syllabus_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- STORED PROCEDURES (RPCs)
-- ==============================================================================

-- 1. Log Study Minutes & Update Streak
CREATE OR REPLACE FUNCTION public.log_study_minutes(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_date DATE;
  v_streak INTEGER;
  v_mins INTEGER;
  v_result JSONB;
BEGIN
  SELECT last_study_date, streak_days, study_minutes
  INTO v_last_date, v_streak, v_mins
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_last_date IS NULL THEN
    v_streak := 1;
    v_mins := p_minutes;
  ELSIF v_last_date = v_today THEN
    v_mins := v_mins + p_minutes;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
    v_mins := p_minutes;
  ELSE
    v_streak := 1;
    v_mins := p_minutes;
  END IF;

  UPDATE public.profiles
  SET study_minutes = v_mins,
      streak_days = v_streak,
      last_study_date = v_today,
      updated_at = NOW()
  WHERE id = p_user_id;

  SELECT to_jsonb(p) INTO v_result
  FROM public.profiles p
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$;

-- 2. Increment Resource Download
CREATE OR REPLACE FUNCTION public.increment_resource_download(p_resource_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_downloads INTEGER;
BEGIN
  UPDATE public.resources
  SET downloads = downloads + 1
  WHERE id = p_resource_id
  RETURNING downloads INTO v_downloads;

  RETURN COALESCE(v_downloads, 0);
END;
$$;

-- 3. Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'aspirant'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
