import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildResourceSynopsisMarkdown,
  buildTopicBriefMarkdown,
  countWords,
  normalizeProfile,
} from '../format';
import { getAccessToken, isSupabaseConfigured, supabase } from '../supabase';
import type {
  AdminAuditEntry,
  BroadcastClass,
  InfographicItem,
  LectureDoubt,
  LectureNote,
  MainsQuestion,
  MainsSubmissionRecord,
  ModerationStatus,
  Quiz,
  QuizQuestion,
  ResourceItem,
  SyllabusPaper,
  TestAttemptRecord,
  TopicOfDay,
  UserProfileData,
  UserRole,
} from '../../types';
import {
  attemptSpec,
  auditLogSpec,
  broadcastSpec,
  doubtSpec,
  fromRow,
  mainsQuestionSpec,
  mainsSubmissionSpec,
  noteSpec,
  profileSpec,
  questionSpec,
  quizSpec,
  resourceSpec,
  selectColumns,
  syllabusPaperSpec,
  syllabusSubtopicSpec,
  topicSpec,
  toRow,
} from './mappers';
import type {
  DataRepo,
  NewAttemptPayload,
  NewBroadcastPayload,
  NewMainsQuestionPayload,
  NewQuizImportPayload,
  NewResourcePayload,
  NewTopicPayload,
  ProfilePatch,
  Unsubscribe,
} from './repo';

function client(): SupabaseClient | null {
  return isSupabaseConfigured ? supabase : null;
}

const localRepo = new Proxy({} as DataRepo, {
  get: () => () => {
    throw new Error('No local data fallback is available. Check Supabase configuration, connectivity, and schema migrations.');
  },
});

function makeSlugId(prefix: string): string {
  const uid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${uid}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

export const supabaseRepo: DataRepo = {
  mode: 'supabase',

  async getProfile(user) {
    const sb = client();
    if (!sb) {
      return localRepo.getProfile(user);
    }

    const { data, error } = await sb
      .from('profiles')
      .select(selectColumns(profileSpec))
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) {
      return normalizeProfile(fromRow(profileSpec, data as Record<string, any>));
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    const { data: retryData } = await sb
      .from('profiles')
      .select(selectColumns(profileSpec))
      .eq('id', user.id)
      .maybeSingle();

    if (retryData) {
      return normalizeProfile(fromRow(profileSpec, retryData as Record<string, any>));
    }

    throw new Error('Your Supabase profile was not created. Contact support before continuing.');
  },

  async updateProfile(uid, patch: ProfilePatch) {
    const sb = client();
    if (!sb) return localRepo.updateProfile(uid, patch);

    const row = toRow(profileSpec, patch);
    const { data, error } = await sb
      .from('profiles')
      .update(row)
      .eq('id', uid)
      .select(selectColumns(profileSpec))
      .single();

    if (error) throw new Error(error.message);
    return normalizeProfile(fromRow(profileSpec, data as Record<string, any>));
  },

  async logStudyMinutes(uid, addedMinutes) {
    const sb = client();
    if (!sb) return localRepo.logStudyMinutes(uid, addedMinutes);

    const { data, error } = await sb.rpc('log_study_minutes', {
      p_minutes: addedMinutes,
    });
    if (error) throw new Error(error.message);
    return normalizeProfile(fromRow(profileSpec, data as Record<string, any>));
  },

  async setSandboxRole(uid, role) {
    if (localRepo.setSandboxRole) {
      return localRepo.setSandboxRole(uid, role);
    }
    return localRepo.getProfile({ id: uid, email: '', displayName: '', role });
  },

  async listBroadcasts() {
    const sb = client();
    if (!sb) return localRepo.listBroadcasts();

    const { data, error } = await sb
      .from('broadcast_classes')
      .select(selectColumns(broadcastSpec))
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    const items = ((data ?? []) as Record<string, any>[]).map((r) => fromRow(broadcastSpec, r));
    return items.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  },

  async createBroadcast(payload: NewBroadcastPayload) {
    const sb = client();
    if (!sb) return localRepo.createBroadcast(payload);

    const id = makeSlugId('broadcast');
    const row = toRow(broadcastSpec, { id, ...payload });
    const { data, error } = await sb
      .from('broadcast_classes')
      .insert(row)
      .select(selectColumns(broadcastSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(broadcastSpec, data as Record<string, any>);
  },

  async updateBroadcast(id, patch) {
    const sb = client();
    if (!sb) return localRepo.updateBroadcast(id, patch);

    const row = toRow(broadcastSpec, patch);
    const { data, error } = await sb
      .from('broadcast_classes')
      .update(row)
      .eq('id', id)
      .select(selectColumns(broadcastSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(broadcastSpec, data as Record<string, any>);
  },

  async deleteBroadcast(id) {
    const sb = client();
    if (!sb) return localRepo.deleteBroadcast(id);
    const { error } = await sb.from('broadcast_classes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  subscribeBroadcasts(onChange: () => void): Unsubscribe {
    const sb = client();
    if (!sb) return localRepo.subscribeBroadcasts(onChange);

    const channel = sb
      .channel(`realtime:broadcasts:${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_classes' }, () => {
        onChange();
      })
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  },

  joinClassroomPresence(broadcastId, viewerKey, onCount): Unsubscribe {
    const sb = client();
    if (!sb) return localRepo.joinClassroomPresence(broadcastId, viewerKey, onCount);

    const channel = sb.channel(`classroom:${broadcastId}`, {
      config: { presence: { key: viewerKey } },
    });

    const syncCount = () => {
      const state = channel.presenceState();
      const total = Object.keys(state).length;
      onCount(Math.max(1, total));
    };

    channel
      .on('presence', { event: 'sync' }, syncCount)
      .on('presence', { event: 'join' }, syncCount)
      .on('presence', { event: 'leave' }, syncCount)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joinedAt: new Date().toISOString() });
        }
      });

    return () => {
      void sb.removeChannel(channel);
    };
  },

  async listDoubts(broadcastId, viewerId) {
    const sb = client();
    if (!sb) return localRepo.listDoubts(broadcastId, viewerId);

    const [{ data: rows, error }, { data: upvoteRows }] = await Promise.all([
      sb
        .from('lecture_doubts')
        .select(selectColumns(doubtSpec))
        .eq('broadcast_id', broadcastId)
        .order('upvotes', { ascending: false })
        .order('created_at', { ascending: false }),
      sb.from('doubt_upvotes').select('doubt_id').eq('user_id', viewerId),
    ]);

    if (error) throw new Error(error.message);
    const upvotedIds = new Set(((upvoteRows ?? []) as { doubt_id: string }[]).map((u) => u.doubt_id));
    return ((rows ?? []) as Record<string, any>[]).map((r) => {
      const d = fromRow(doubtSpec, r);
      return { ...d, userUpvoted: upvotedIds.has(d.id) };
    });
  },

  async postDoubt(broadcastId, author, query) {
    const sb = client();
    if (!sb) return localRepo.postDoubt(broadcastId, author, query);

    const { data, error } = await sb
      .from('lecture_doubts')
      .insert({
        broadcast_id: broadcastId,
        query: query.trim(),
      })
      .select(selectColumns(doubtSpec))
      .single();

    if (error) throw new Error(error.message);
    return { ...fromRow(doubtSpec, data as Record<string, any>), userUpvoted: false };
  },

  async toggleDoubtUpvote(doubtId, viewerId) {
    const sb = client();
    if (!sb) return localRepo.toggleDoubtUpvote(doubtId, viewerId);

    const { data: existing } = await sb
      .from('doubt_upvotes')
      .select('doubt_id')
      .eq('doubt_id', doubtId)
      .eq('user_id', viewerId)
      .maybeSingle();

    let upvoted = false;
    if (existing) {
      const { error } = await sb
        .from('doubt_upvotes')
        .delete()
        .eq('doubt_id', doubtId)
        .eq('user_id', viewerId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from('doubt_upvotes')
        .insert({ doubt_id: doubtId, user_id: viewerId });
      if (error) throw new Error(error.message);
      upvoted = true;
    }

    const { data: updated } = await sb
      .from('lecture_doubts')
      .select('upvotes')
      .eq('id', doubtId)
      .single();

    return {
      upvotes: Number((updated as { upvotes?: number } | null)?.upvotes ?? 0),
      upvoted,
    };
  },

  async answerDoubt(doubtId, reply) {
    const sb = client();
    if (!sb) return localRepo.answerDoubt(doubtId, reply);

    const trimmed = reply.trim();
    const { data, error } = await sb
      .from('lecture_doubts')
      .update({ faculty_reply: trimmed || null })
      .eq('id', doubtId)
      .select(selectColumns(doubtSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(doubtSpec, data as Record<string, any>);
  },

  async deleteDoubt(doubtId) {
    const sb = client();
    if (!sb) return localRepo.deleteDoubt(doubtId);
    const { error } = await sb.from('lecture_doubts').delete().eq('id', doubtId);
    if (error) throw new Error(error.message);
  },

  subscribeDoubts(broadcastId, onChange): Unsubscribe {
    const sb = client();
    if (!sb) return localRepo.subscribeDoubts(broadcastId, onChange);

    const channel = sb
      .channel(`realtime:doubts:${broadcastId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lecture_doubts',
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  },

  async listNotes(broadcastId, userId) {
    const sb = client();
    if (!sb) return localRepo.listNotes(broadcastId, userId);

    const { data, error } = await sb
      .from('lecture_notes')
      .select(selectColumns(noteSpec))
      .eq('broadcast_id', broadcastId)
      .eq('user_id', userId)
      .order('timestamp_seconds', { ascending: true });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(noteSpec, r));
  },

  async addNote(broadcastId, userId, timestampSeconds, text) {
    const sb = client();
    if (!sb) return localRepo.addNote(broadcastId, userId, timestampSeconds, text);

    const { data, error } = await sb
      .from('lecture_notes')
      .insert({
        broadcast_id: broadcastId,
        user_id: userId,
        timestamp_seconds: Math.max(0, Math.floor(timestampSeconds)),
        text: text.trim(),
      })
      .select(selectColumns(noteSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(noteSpec, data as Record<string, any>);
  },

  async deleteNote(noteId) {
    const sb = client();
    if (!sb) return localRepo.deleteNote(noteId);
    const { error } = await sb.from('lecture_notes').delete().eq('id', noteId);
    if (error) throw new Error(error.message);
  },

  async listQuizzes(includeDrafts) {
    const sb = client();
    if (!sb) return localRepo.listQuizzes(includeDrafts);

    let q = sb
      .from('quizzes')
      .select(`${selectColumns(quizSpec)}, quiz_question_links(question_id, position)`)
      .order('created_at', { ascending: false });
    if (!includeDrafts) {
      q = q.eq('is_published', true);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return ((data ?? []) as Record<string, any>[]).map((row) => {
      const base = fromRow(quizSpec, row);
      const links = ((row.quiz_question_links ?? []) as { question_id: string; position: number }[])
        .slice()
        .sort((a, b) => a.position - b.position);
      return {
        ...base,
        questionIds: links.map((l) => l.question_id),
      };
    });
  },

  async getQuizQuestions(quizId) {
    const sb = client();
    if (!sb) return localRepo.getQuizQuestions(quizId);

    const { data: linkRows, error: linkErr } = await sb
      .from('quiz_question_links')
      .select('question_id, position')
      .eq('quiz_id', quizId)
      .order('position', { ascending: true });

    if (linkErr) throw new Error(linkErr.message);
    const orderedIds = ((linkRows ?? []) as { question_id: string; position: number }[]).map((l) => l.question_id);
    if (orderedIds.length === 0) return [];

    const { data: qRows, error: qErr } = await sb
      .from('quiz_questions')
      .select(selectColumns(questionSpec))
      .in('id', orderedIds);

    if (qErr) throw new Error(qErr.message);
    const byId = new Map<string, QuizQuestion>();
    for (const r of (qRows ?? []) as Record<string, any>[]) {
      const mapped = fromRow(questionSpec, r);
      byId.set(mapped.id, mapped);
    }
    return orderedIds.map((id) => byId.get(id)).filter((q): q is QuizQuestion => Boolean(q));
  },

  async importQuiz(payload: NewQuizImportPayload) {
    const sb = client();
    if (!sb) return localRepo.importQuiz(payload);

    const { data: quizId, error } = await sb.rpc('import_quiz', {
      p_quiz: {
        title: payload.title.trim(),
        gsPaper: payload.gsPaper,
        subject: payload.subject.trim(),
        testType: payload.testType,
        durationMinutes: payload.durationMinutes,
        isPublished: payload.isPublished,
      },
      p_questions: payload.questions,
    });

    if (error) throw new Error(error.message);

    const { data: row, error: fetchErr } = await sb
      .from('quizzes')
      .select(`${selectColumns(quizSpec)}, quiz_question_links(question_id, position)`)
      .eq('id', String(quizId))
      .single();

    if (fetchErr) throw new Error(fetchErr.message);
    const r = row as Record<string, any>;
    const links = ((r.quiz_question_links ?? []) as { question_id: string; position: number }[])
      .slice()
      .sort((a, b) => a.position - b.position);

    return {
      ...fromRow(quizSpec, r),
      questionIds: links.map((l) => l.question_id),
    };
  },

  async setQuizPublished(quizId, isPublished) {
    const sb = client();
    if (!sb) return localRepo.setQuizPublished(quizId, isPublished);

    const { data, error } = await sb
      .from('quizzes')
      .update({ is_published: isPublished })
      .eq('id', quizId)
      .select(`${selectColumns(quizSpec)}, quiz_question_links(question_id, position)`)
      .single();

    if (error) throw new Error(error.message);
    const row = data as Record<string, any>;
    const links = ((row.quiz_question_links ?? []) as { question_id: string; position: number }[])
      .slice()
      .sort((a, b) => a.position - b.position);
    return {
      ...fromRow(quizSpec, row),
      questionIds: links.map((l) => l.question_id),
    };
  },

  async deleteQuiz(quizId) {
    const sb = client();
    if (!sb) return localRepo.deleteQuiz(quizId);
    const { error } = await sb.from('quizzes').delete().eq('id', quizId);
    if (error) throw new Error(error.message);
  },

  async listAttempts(userId) {
    const sb = client();
    if (!sb) return localRepo.listAttempts(userId);

    const { data, error } = await sb
      .from('test_attempts')
      .select(selectColumns(attemptSpec))
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(attemptSpec, r));
  },

  async saveAttempt(userId, payload: NewAttemptPayload) {
    const sb = client();
    if (!sb) return localRepo.saveAttempt(userId, payload);

    const row = toRow(attemptSpec, payload);
    const { data, error } = await sb
      .from('test_attempts')
      .insert(row)
      .select(selectColumns(attemptSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(attemptSpec, data as Record<string, any>);
  },

  async listMainsQuestions() {
    const sb = client();
    if (!sb) return localRepo.listMainsQuestions();

    const { data, error } = await sb
      .from('mains_questions')
      .select(selectColumns(mainsQuestionSpec))
      .order('publish_date', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(mainsQuestionSpec, r));
  },

  async createMainsQuestion(payload: NewMainsQuestionPayload) {
    const sb = client();
    if (!sb) return localRepo.createMainsQuestion(payload);

    const id = makeSlugId('mains');
    const row = toRow(mainsQuestionSpec, { id, ...payload });
    const { data, error } = await sb
      .from('mains_questions')
      .insert(row)
      .select(selectColumns(mainsQuestionSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(mainsQuestionSpec, data as Record<string, any>);
  },

  async deleteMainsQuestion(id) {
    const sb = client();
    if (!sb) return localRepo.deleteMainsQuestion(id);
    const { error } = await sb.from('mains_questions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async listSubmissions(userId) {
    const sb = client();
    if (!sb) return localRepo.listSubmissions(userId);

    const query = sb.from('mains_submissions').select(selectColumns(mainsSubmissionSpec));
    if (userId) query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(mainsSubmissionSpec, r));
  },

  async listAllSubmissions() {
    const sb = client();
    if (!sb) return localRepo.listAllSubmissions ? localRepo.listAllSubmissions() : localRepo.listSubmissions('');

    const { data, error } = await sb
      .from('mains_submissions')
      .select(selectColumns(mainsSubmissionSpec))
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(mainsSubmissionSpec, r));
  },

  async gradeMainsSubmission(submissionId, score, feedback, evaluation) {
    const sb = client();
    if (!sb) {
      if (localRepo.gradeMainsSubmission) {
        return localRepo.gradeMainsSubmission(submissionId, score, feedback, evaluation);
      }
      throw new Error('Grading not supported in localRepo fallback.');
    }

    const { data, error } = await sb
      .from('mains_submissions')
      .update({
        score,
        feedback,
        status: 'evaluated',
        ...(evaluation ? { evaluation } : {}),
      })
      .eq('id', submissionId)
      .select(selectColumns(mainsSubmissionSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(mainsSubmissionSpec, data as Record<string, any>);
  },

  async submitAndEvaluateMains(userId, question, answerText) {
    const sb = client();
    if (!sb) return localRepo.submitAndEvaluateMains(userId, question, answerText);

    const trimmed = answerText.trim();
    const words = countWords(trimmed);

    const { data: inserted, error: insErr } = await sb
      .from('mains_submissions')
      .insert({
        question_id: question.id,
        question_prompt: question.prompt,
        answer_text: trimmed,
        word_count: words,
        max_marks: question.marks,
      })
      .select(selectColumns(mainsSubmissionSpec))
      .single();

    if (insErr) throw new Error(insErr.message);
    const pending = fromRow(mainsSubmissionSpec, inserted as Record<string, any>);

    const token = await getAccessToken();
    const resp = await fetch('/api/mains/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        submissionId: pending.id,
        question,
        answerText: trimmed,
      }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error || `Mains evaluation failed (${resp.status}).`);
    }

    const evalBody = (await resp.json()) as {
      submission?: Record<string, any>;
      score: number;
      feedback: string;
      evaluation: MainsSubmissionRecord['evaluation'];
    };

    if (evalBody.submission) {
      return fromRow(mainsSubmissionSpec, evalBody.submission);
    }

    return {
      ...pending,
      status: 'evaluated',
      score: evalBody.score,
      feedback: evalBody.feedback,
      evaluation: evalBody.evaluation,
    };
  },

  async listTopicsOfDay() {
    const sb = client();
    if (!sb) return localRepo.listTopicsOfDay();

    const { data, error } = await sb
      .from('topics_of_day')
      .select(selectColumns(topicSpec))
      .order('publish_date', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(topicSpec, r));
  },

  async publishTopicOfDay(payload: NewTopicPayload) {
    const sb = client();
    if (!sb) return localRepo.publishTopicOfDay(payload);

    const id = makeSlugId('topic');
    let pdfBriefPath: string | undefined;
    let pdfBriefName = `${sanitizeFilename(payload.title)}_Brief.md`;

    if (payload.briefFile) {
      pdfBriefName = payload.briefFile.name;
      const storagePath = `crux/${payload.publishDate}-${Date.now()}-${sanitizeFilename(payload.briefFile.name)}`;
      const { error: upErr } = await sb.storage.from('briefs').upload(storagePath, payload.briefFile, {
        upsert: true,
        contentType: payload.briefFile.type || 'application/pdf',
      });
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
      pdfBriefPath = storagePath;
    }

    const row = toRow(topicSpec, {
      id,
      title: payload.title.trim(),
      category: payload.category.trim(),
      source: payload.source.trim(),
      publishDate: payload.publishDate,
      readTimeMinutes: payload.readTimeMinutes,
      gsPaper: payload.gsPaper,
      summaryBullets: payload.summaryBullets,
      keyArticlesOrData: payload.keyArticlesOrData,
      mindmapNodes: payload.mindmapNodes,
      pdfBriefName,
      pdfBriefPath,
    });

    const { data, error } = await sb
      .from('topics_of_day')
      .insert(row)
      .select(selectColumns(topicSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(topicSpec, data as Record<string, any>);
  },

  async deleteTopicOfDay(id) {
    const sb = client();
    if (!sb) return localRepo.deleteTopicOfDay(id);
    const { error } = await sb.from('topics_of_day').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateTopicInfographics(id: string, infographics: InfographicItem[]) {
    const sb = client();
    if (!sb) return localRepo.updateTopicInfographics(id, infographics);
    try {
      const { data, error } = await sb
        .from('topics_of_day')
        .update({ infographics })
        .eq('id', id)
        .select(selectColumns(topicSpec))
        .single();
      if (!error && data) {
        return fromRow(topicSpec, data as Record<string, any>);
      }
    } catch {
      // fallback to localRepo if remote schema doesn't have infographics column yet
    }
    return localRepo.updateTopicInfographics(id, infographics);
  },

  async openTopicBrief(topic) {
    const sb = client();
    if (!sb) return localRepo.openTopicBrief(topic);

    let signedUrl: string | null = null;
    if (topic.pdfBriefPath) {
      const { data } = await sb.storage.from('briefs').createSignedUrl(topic.pdfBriefPath, 3600);
      signedUrl = data?.signedUrl ?? null;
    }
    const md = buildTopicBriefMarkdown(topic);
    const baseName = topic.pdfBriefName.endsWith('.md')
      ? topic.pdfBriefName
      : `${topic.pdfBriefName.replace(/\.[^.]+$/, '')}.md`;

    return {
      title: topic.title,
      subtitle: `${topic.gsPaper} · ${topic.category} · ${topic.publishDate}`,
      signedUrl,
      markdownContent: md,
      downloadFilename: baseName,
    };
  },

  async listResources(viewerId, isStaff) {
    const sb = client();
    if (!sb) return localRepo.listResources(viewerId, isStaff);

    try {
      const { data, error } = await sb
        .from('resources')
        .select(selectColumns(resourceSpec))
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase resources table not available, using local store:', error.message);
        return localRepo.listResources(viewerId, isStaff);
      }
      return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(resourceSpec, r));
    } catch {
      return localRepo.listResources(viewerId, isStaff);
    }
  },

  async uploadResource(viewerId, isStaff, payload: NewResourcePayload) {
    const sb = client();
    if (!sb) return localRepo.uploadResource(viewerId, isStaff, payload);

    try {
      let filePath: string | undefined;
      const sizeBytes = payload.file?.size ?? (payload.fileData ? Math.round(payload.fileData.length * 0.75) : 1_048_576);

      if (payload.file) {
        const storagePath = `${viewerId}/${Date.now()}-${sanitizeFilename(payload.file.name)}`;
        const contentType =
          payload.file.type ||
          (payload.format === 'jpg' ? 'image/jpeg' : payload.format === 'png' ? 'image/png' : 'application/pdf');
        const { error: upErr } = await sb.storage.from('resources').upload(storagePath, payload.file, {
          upsert: false,
          contentType,
        });
        if (upErr) {
          console.warn('Supabase storage upload error, saving to local store:', upErr.message);
          return localRepo.uploadResource(viewerId, isStaff, payload);
        }
        filePath = storagePath;
      }

      const insertRow = {
        title: payload.title.trim(),
        category: payload.category,
        gs_paper: payload.gsPaper,
        format: payload.format,
        size_bytes: sizeBytes,
        pages: payload.pages,
        author_or_source: payload.authorOrSource.trim(),
        summary: payload.summary.trim(),
        topics_covered: payload.topicsCovered,
        ...(filePath ? { file_path: filePath } : {}),
      };

      const { data, error } = await sb
        .from('resources')
        .insert(insertRow)
        .select(selectColumns(resourceSpec))
        .single();

      if (error) {
        console.warn('Supabase resources insert error, falling back to local store:', error.message);
        return localRepo.uploadResource(viewerId, isStaff, payload);
      }
      const item = fromRow(resourceSpec, data as Record<string, any>);
      if (payload.fileData) item.fileData = payload.fileData;
      return item;
    } catch (err) {
      console.warn('Supabase resource upload failed, falling back to local store:', err);
      return localRepo.uploadResource(viewerId, isStaff, payload);
    }
  },

  async setResourceModeration(id, status) {
    const sb = client();
    if (!sb) return localRepo.setResourceModeration(id, status);

    const { data, error } = await sb
      .from('resources')
      .update({ moderation_status: status })
      .eq('id', id)
      .select(selectColumns(resourceSpec))
      .single();

    if (error) throw new Error(error.message);
    return fromRow(resourceSpec, data as Record<string, any>);
  },

  async deleteResource(id) {
    const sb = client();
    if (!sb) return localRepo.deleteResource(id);
    const { error } = await sb.from('resources').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async openResource(item) {
    const sb = client();
    if (!sb) return localRepo.openResource(item);

    const { data: nextCount } = await sb.rpc('increment_resource_download', {
      p_id: item.id,
    });

    let signedUrl: string | null = null;
    if (item.filePath) {
      const { data } = await sb.storage.from('resources').createSignedUrl(item.filePath, 3600);
      signedUrl = data?.signedUrl ?? null;
    }

    const imageUrl =
      item.format === 'jpg' || item.format === 'png'
        ? item.fileData || signedUrl || null
        : null;
    const md = buildResourceSynopsisMarkdown(item);
    const safeSlug = sanitizeFilename(item.title).slice(0, 48);
    const ext = item.format === 'pdf' ? 'pdf' : item.format === 'jpg' ? 'jpg' : item.format === 'png' ? 'png' : 'md';

    return {
      downloads: typeof nextCount === 'number' ? nextCount : item.downloads + 1,
      doc: {
        title: item.title,
        subtitle: `${item.gsPaper} · ${item.authorOrSource}`,
        signedUrl: signedUrl || (item.fileData && item.format === 'pdf' ? item.fileData : null),
        imageUrl,
        format: item.format,
        markdownContent: md,
        downloadFilename: `${safeSlug}.${ext}`,
      },
    };
  },

  subscribeResources(onChange): Unsubscribe {
    const sb = client();
    if (!sb) return localRepo.subscribeResources(onChange);

    const channel = sb
      .channel(`realtime:resources:${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        onChange();
      })
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  },

  async loadSyllabus(userId) {
    const sb = client();
    if (!sb) return localRepo.loadSyllabus(userId);

    const [{ data: paperRows, error: pErr }, { data: subRows, error: sErr }, { data: progRows, error: prErr }] =
      await Promise.all([
        sb.from('syllabus_papers').select('paper, title, position').order('position', { ascending: true }),
        sb.from('syllabus_subtopics').select('id, paper, name, importance, position').order('position', { ascending: true }),
        sb.from('syllabus_progress').select('subtopic_id').eq('user_id', userId),
      ]);

    if (pErr) throw new Error(pErr.message);
    if (sErr) throw new Error(sErr.message);
    if (prErr) throw new Error(prErr.message);

    const completedSet = new Set(((progRows ?? []) as { subtopic_id: string }[]).map((r) => r.subtopic_id));
    const subtopicsByPaper = new Map<string, SyllabusPaper['subtopics']>();

    for (const sr of (subRows ?? []) as Record<string, any>[]) {
      const paperKey = sr.paper as string;
      const mapped = fromRow(syllabusSubtopicSpec, sr);
      const list = subtopicsByPaper.get(paperKey) ?? [];
      list.push({ ...mapped, completed: completedSet.has(mapped.id) });
      subtopicsByPaper.set(paperKey, list);
    }

    return ((paperRows ?? []) as Record<string, any>[]).map((pr) => {
      const base = fromRow(syllabusPaperSpec, pr);
      return {
        ...base,
        subtopics: subtopicsByPaper.get(base.paper) ?? [],
      };
    });
  },

  async setSubtopicCompleted(userId, subtopicId, completed) {
    const sb = client();
    if (!sb) return localRepo.setSubtopicCompleted(userId, subtopicId, completed);

    if (completed) {
      const { error } = await sb
        .from('syllabus_progress')
        .upsert({ user_id: userId, subtopic_id: subtopicId }, { onConflict: 'user_id,subtopic_id' });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from('syllabus_progress')
        .delete()
        .eq('user_id', userId)
        .eq('subtopic_id', subtopicId);
      if (error) throw new Error(error.message);
    }
  },

  async listAllProfiles() {
    const sb = client();
    if (!sb) return localRepo.listAllProfiles();

    const { data, error } = await sb
      .from('profiles')
      .select(selectColumns(profileSpec))
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => normalizeProfile(fromRow(profileSpec, r)));
  },

  async setUserRole(targetUid, role: UserRole) {
    const sb = client();
    if (!sb) return localRepo.setUserRole(targetUid, role);

    const { error } = await sb.rpc('admin_set_user_role', {
      p_user_id: targetUid,
      p_role: role,
    });
    if (error) throw new Error(error.message);
  },

  async listAuditLogs(limit = 25) {
    const sb = client();
    if (!sb) return localRepo.listAuditLogs(limit);

    const { data, error } = await sb
      .from('admin_audit_log')
      .select(selectColumns(auditLogSpec))
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map((r) => fromRow(auditLogSpec, r));
  },
};
