-- Production hardening and schema support for the application repository.

ALTER TABLE public.broadcast_classes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.mains_questions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.topics_of_day
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.mains_submissions ALTER COLUMN status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'mentor')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users and staff can view profiles" ON public.profiles;
CREATE POLICY "Users and staff can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, photo_url, target_year, optional_subject, target_minutes)
  ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.quiz_question_links (
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  PRIMARY KEY (quiz_id, question_id),
  UNIQUE (quiz_id, position)
);

ALTER TABLE public.quiz_question_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published quiz links are readable" ON public.quiz_question_links;
CREATE POLICY "Published quiz links are readable"
  ON public.quiz_question_links FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.is_published)
    OR public.is_staff()
  );
DROP POLICY IF EXISTS "Staff manage quiz links" ON public.quiz_question_links;
CREATE POLICY "Staff manage quiz links"
  ON public.quiz_question_links FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DO $$
DECLARE
  v_doubt_id_type TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
  INTO v_doubt_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.lecture_doubts'::regclass
    AND a.attname = 'id'
    AND NOT a.attisdropped;

  IF v_doubt_id_type IS NULL THEN
    RAISE EXCEPTION 'public.lecture_doubts.id is required before creating doubt_upvotes';
  END IF;

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.doubt_upvotes (
      doubt_id %s NOT NULL REFERENCES public.lecture_doubts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (doubt_id, user_id)
    )',
    v_doubt_id_type
  );
END;
$$;

ALTER TABLE public.doubt_upvotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view doubt upvotes" ON public.doubt_upvotes;
CREATE POLICY "Users can view doubt upvotes"
  ON public.doubt_upvotes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage their own doubt upvotes" ON public.doubt_upvotes;
CREATE POLICY "Users manage their own doubt upvotes"
  ON public.doubt_upvotes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_doubt_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doubt_id TEXT := COALESCE(NEW.doubt_id::TEXT, OLD.doubt_id::TEXT);
BEGIN
  UPDATE public.lecture_doubts
  SET upvotes = (SELECT count(*) FROM public.doubt_upvotes WHERE doubt_id::TEXT = v_doubt_id)
  WHERE id::TEXT = v_doubt_id;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_doubt_upvote_count ON public.doubt_upvotes;
CREATE TRIGGER sync_doubt_upvote_count
  AFTER INSERT OR DELETE ON public.doubt_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_doubt_upvote_count();

CREATE OR REPLACE FUNCTION public.set_lecture_doubt_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  SELECT display_name, COALESCE(photo_url, '')
  INTO NEW.user_name, NEW.avatar
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_lecture_doubt_author ON public.lecture_doubts;
CREATE TRIGGER set_lecture_doubt_author
  BEFORE INSERT ON public.lecture_doubts
  FOR EACH ROW EXECUTE FUNCTION public.set_lecture_doubt_author();

CREATE TABLE IF NOT EXISTS public.syllabus_papers (
  paper TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.syllabus_subtopics (
  id TEXT PRIMARY KEY,
  paper TEXT NOT NULL REFERENCES public.syllabus_papers(paper) ON DELETE CASCADE,
  name TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('high', 'medium', 'low')),
  position INTEGER NOT NULL,
  UNIQUE (paper, position)
);

ALTER TABLE public.syllabus_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_subtopics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Syllabus is readable by authenticated users" ON public.syllabus_papers;
CREATE POLICY "Syllabus is readable by authenticated users"
  ON public.syllabus_papers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Syllabus topics are readable by authenticated users" ON public.syllabus_subtopics;
CREATE POLICY "Syllabus topics are readable by authenticated users"
  ON public.syllabus_subtopics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff manage syllabus" ON public.syllabus_papers;
CREATE POLICY "Staff manage syllabus"
  ON public.syllabus_papers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage syllabus topics" ON public.syllabus_subtopics;
CREATE POLICY "Staff manage syllabus topics"
  ON public.syllabus_subtopics FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  row_id TEXT,
  old_row JSONB,
  new_row JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can read audit logs" ON public.admin_audit_log;
CREATE POLICY "Staff can read audit logs"
  ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_staff());

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('aspirant', 'mentor', 'admin') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, table_name, operation, row_id, new_row)
  VALUES (auth.uid(), 'profiles', 'SET_ROLE', p_user_id::TEXT, jsonb_build_object('role', p_role));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_study_minutes(p_minutes INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL OR p_minutes <= 0 OR p_minutes > 1440 THEN
    RAISE EXCEPTION 'Invalid study log request' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE public.profiles
  SET study_minutes = CASE
        WHEN last_study_date = v_today THEN study_minutes + p_minutes
        ELSE p_minutes
      END,
      streak_days = CASE
        WHEN last_study_date = v_today THEN streak_days
        WHEN last_study_date = v_today - 1 THEN streak_days + 1
        ELSE 1
      END,
      last_study_date = v_today,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

REVOKE ALL ON FUNCTION public.log_study_minutes(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_study_minutes(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_study_minutes(INTEGER) TO authenticated;

DROP POLICY IF EXISTS "Questions readable by everyone" ON public.quiz_questions;
DROP POLICY IF EXISTS "Linked published quiz questions are readable" ON public.quiz_questions;
CREATE POLICY "Linked published quiz questions are readable"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1
      FROM public.quiz_question_links link
      JOIN public.quizzes q ON q.id = link.quiz_id
      WHERE link.question_id = id AND q.is_published
    )
  );

DROP POLICY IF EXISTS "Quizzes readable by everyone" ON public.quizzes;
DROP POLICY IF EXISTS "Published quizzes visible to authenticated users" ON public.quizzes;
CREATE POLICY "Published quizzes visible to authenticated users"
  ON public.quizzes FOR SELECT TO authenticated
  USING (is_published OR public.is_staff());

DROP POLICY IF EXISTS "Staff manage quizzes" ON public.quizzes;
CREATE POLICY "Staff manage quizzes"
  ON public.quizzes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Staff manage quiz questions"
  ON public.quiz_questions FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage mains questions" ON public.mains_questions;
CREATE POLICY "Staff manage mains questions"
  ON public.mains_questions FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage topics" ON public.topics_of_day;
CREATE POLICY "Staff manage topics"
  ON public.topics_of_day FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff manage resources" ON public.resources;
CREATE POLICY "Staff manage resources"
  ON public.resources FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.import_quiz(p_quiz JSONB, p_questions JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id UUID;
  v_question JSONB;
  v_question_id UUID;
  v_position INTEGER := 0;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Staff access required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_questions) IS DISTINCT FROM 'array' OR jsonb_array_length(p_questions) = 0 THEN
    RAISE EXCEPTION 'At least one question is required';
  END IF;

  INSERT INTO public.quizzes (title, gs_paper, subject, test_type, duration_minutes, is_published, created_by)
  VALUES (
    NULLIF(trim(p_quiz->>'title'), ''),
    p_quiz->>'gsPaper',
    NULLIF(trim(p_quiz->>'subject'), ''),
    p_quiz->>'testType',
    GREATEST(1, COALESCE((p_quiz->>'durationMinutes')::INTEGER, 30)),
    COALESCE((p_quiz->>'isPublished')::BOOLEAN, FALSE),
    auth.uid()
  )
  RETURNING id INTO v_quiz_id;

  FOR v_question IN SELECT value FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO public.quiz_questions (
      subject, topic, gs_paper, question_en, question_hi, statements_en, statements_hi,
      options_en, options_hi, correct_index, explanation_en, explanation_hi, source_book, created_by
    )
    VALUES (
      v_question->>'subject',
      COALESCE(v_question->>'topic', ''),
      v_question->>'gsPaper',
      v_question->>'questionEn',
      v_question->>'questionHi',
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'statementsEn', '[]'::JSONB))),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'statementsHi', '[]'::JSONB))),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'optionsEn', '[]'::JSONB))),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'optionsHi', '[]'::JSONB))),
      (v_question->>'correctIndex')::INTEGER,
      v_question->>'explanationEn',
      v_question->>'explanationHi',
      COALESCE(v_question->>'sourceBook', 'Faculty Bank'),
      auth.uid()
    )
    RETURNING id INTO v_question_id;

    INSERT INTO public.quiz_question_links (quiz_id, question_id, position)
    VALUES (v_quiz_id, v_question_id, v_position);
    v_position := v_position + 1;
  END LOOP;

  RETURN v_quiz_id;
END;
$$;

REVOKE ALL ON FUNCTION public.import_quiz(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_quiz(JSONB, JSONB) TO authenticated;

DROP POLICY IF EXISTS "Users view and insert their own mains submissions" ON public.mains_submissions;
DROP POLICY IF EXISTS "Users can view their own mains submissions" ON public.mains_submissions;
CREATE POLICY "Users can view their own mains submissions"
  ON public.mains_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can submit their own mains answers" ON public.mains_submissions;
CREATE POLICY "Users can submit their own mains answers"
  ON public.mains_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Broadcasts viewable by anyone" ON public.broadcast_classes;
DROP POLICY IF EXISTS "Authenticated users can view broadcasts" ON public.broadcast_classes;
CREATE POLICY "Authenticated users can view broadcasts"
  ON public.broadcast_classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can delete broadcasts" ON public.broadcast_classes;
CREATE POLICY "Staff can delete broadcasts"
  ON public.broadcast_classes FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Doubts viewable by all" ON public.lecture_doubts;
DROP POLICY IF EXISTS "Authenticated users can view doubts" ON public.lecture_doubts;
CREATE POLICY "Authenticated users can view doubts"
  ON public.lecture_doubts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can moderate doubts" ON public.lecture_doubts;
CREATE POLICY "Staff can moderate doubts"
  ON public.lecture_doubts FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "Staff can delete doubts" ON public.lecture_doubts;
CREATE POLICY "Staff can delete doubts"
  ON public.lecture_doubts FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Mains questions viewable by all" ON public.mains_questions;
DROP POLICY IF EXISTS "Authenticated users can view mains questions" ON public.mains_questions;
CREATE POLICY "Authenticated users can view mains questions"
  ON public.mains_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Topics readable by all" ON public.topics_of_day;
DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.topics_of_day;
CREATE POLICY "Authenticated users can view topics"
  ON public.topics_of_day FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Approved resources readable by all" ON public.resources;
DROP POLICY IF EXISTS "Approved resources visible to authenticated users" ON public.resources;
CREATE POLICY "Approved resources visible to authenticated users"
  ON public.resources FOR SELECT TO authenticated
  USING (
    moderation_status = 'approved' OR uploaded_by = auth.uid() OR public.is_staff()
  );

UPDATE storage.buckets SET public = FALSE WHERE id IN ('handouts', 'resources', 'avatars');
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefs', 'briefs', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "Handouts are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Resources are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated or public upload to resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated or public upload to handouts" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can read handouts" ON storage.objects;
CREATE POLICY "Authenticated users can read handouts"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'handouts');
DROP POLICY IF EXISTS "Staff can upload handouts" ON storage.objects;
CREATE POLICY "Staff can upload handouts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'handouts' AND public.is_staff());
DROP POLICY IF EXISTS "Users can read approved resources" ON storage.objects;
CREATE POLICY "Users can read approved resources"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resources' AND EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.file_path = name AND (
        r.moderation_status = 'approved' OR r.uploaded_by = auth.uid() OR public.is_staff()
      )
    )
  );
DROP POLICY IF EXISTS "Users can upload their own resources" ON storage.objects;
CREATE POLICY "Users can upload their own resources"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Authenticated users can read briefs" ON storage.objects;
CREATE POLICY "Authenticated users can read briefs"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'briefs');
DROP POLICY IF EXISTS "Staff can upload briefs" ON storage.objects;
CREATE POLICY "Staff can upload briefs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'briefs' AND public.is_staff());
DROP POLICY IF EXISTS "Users can read their own avatars" ON storage.objects;
CREATE POLICY "Users can read their own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);