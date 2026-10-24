import { buildSeed } from '../../data/seed';
import { SEED_INFOGRAPHICS } from '../../data/infographics';
import { deleteBlob, getBlob, storeBlob } from './blobStore';
import {
  buildResourceSynopsisMarkdown,
  buildTopicBriefMarkdown,
  countWords,
  formatClock,
  initials,
  normalizeProfile,
  todayIST,
} from '../format';
import type {
  AdminAuditEntry,
  BroadcastClass,
  InfographicItem,
  LectureDoubt,
  LectureNote,
  MainsEvaluation,
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
import type {
  DataRepo,
  DocumentOpenPayload,
  NewAttemptPayload,
  NewBroadcastPayload,
  NewMainsQuestionPayload,
  NewQuizImportPayload,
  NewResourcePayload,
  NewTopicPayload,
  ProfilePatch,
  Unsubscribe,
} from './repo';

const STORAGE_KEY = 'civiledge.sandbox.clean_v1';

interface SandboxStore {
  profiles: Record<string, UserProfileData>;
  broadcasts: BroadcastClass[];
  doubts: LectureDoubt[];
  upvotesByUser: Record<string, string[]>;
  notes: LectureNote[];
  quizQuestions: Record<string, QuizQuestion>;
  quizzes: Quiz[];
  attempts: TestAttemptRecord[];
  mainsQuestions: MainsQuestion[];
  submissions: MainsSubmissionRecord[];
  topics: TopicOfDay[];
  resources: ResourceItem[];
  completedSubtopics: Record<string, string[]>;
  auditLogs: AdminAuditEntry[];
}

const blobUrls = new Map<string, string>();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

try {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('civiledge-sandbox-sync');
    channel.onmessage = () => {
      listeners.forEach((fn) => fn());
    };
  }
} catch {
  channel = null;
}

function notifyAll() {
  listeners.forEach((fn) => fn());
  try {
    channel?.postMessage({ ts: Date.now() });
  } catch {
    // ignore
  }
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildInitialStore(): SandboxStore {
  const seed = buildSeed();
  const today = todayIST();
  const nowIso = new Date().toISOString();

  const questionMap: Record<string, QuizQuestion> = {};
  for (const q of seed.quizQuestions) {
    questionMap[q.id] = q;
  }

  // Admin Director user with clean slate
  const defaultProfile: UserProfileData = {
    uid: '00000000-0000-4000-8000-000000000001',
    displayName: 'CivilEdge Faculty Director',
    email: 'admin@civiledge.in',
    targetYear: '2026',
    optionalSubject: 'Public Administration',
    streakDays: 1,
    studyMinutes: 0,
    targetMinutes: 360,
    role: 'admin',
    lastStudyDate: today,
  };

  return {
    profiles: {
      [defaultProfile.uid]: defaultProfile,
    },
    broadcasts: [], // Clean slate for user/admin to schedule and broadcast their own classes
    doubts: [], // Clean slate for real live doubts
    upvotesByUser: {},
    notes: [], // Clean slate for user's own lecture notes
    quizQuestions: questionMap,
    quizzes: seed.quizzes,
    attempts: [], // Clean slate with zero mock attempts
    mainsQuestions: seed.mainsQuestions,
    submissions: [], // Clean slate with zero mock submissions
    topics: seed.topics,
    resources: seed.resources,
    completedSubtopics: {}, // Clean slate for personal syllabus tracking
    auditLogs: [
      {
        id: 1,
        actorId: defaultProfile.uid,
        tableName: 'system',
        operation: 'INITIALIZE_CLEAN_SLATE',
        rowId: 'admin-seed',
        createdAt: nowIso,
      },
    ],
  };
}

let memoryFallback: SandboxStore | null = null;

function sanitizeStore(store: SandboxStore): SandboxStore {
  let changed = false;
  // Wipe legacy mock records if found in older local storage
  if (store.doubts?.some((d) => d.id.startsWith('doubt-seed'))) {
    store.doubts = [];
    store.upvotesByUser = {};
    changed = true;
  }
  if (store.notes?.some((n) => n.id.startsWith('note-seed'))) {
    store.notes = [];
    changed = true;
  }
  if (store.attempts?.some((a) => a.id.startsWith('attempt-seed'))) {
    store.attempts = [];
    changed = true;
  }
  // Guarantee admin accounts have admin role
  if (!store.profiles) store.profiles = {};
  for (const prof of Object.values(store.profiles)) {
  }
  // Backfill seed infographics if topic lacks infographics
  if (store.topics) {
    store.topics.forEach((t) => {
      if (!t.infographics || t.infographics.length === 0) {
        if (SEED_INFOGRAPHICS[t.id]) {
          t.infographics = SEED_INFOGRAPHICS[t.id];
          changed = true;
        }
      }
    });
  }
  if (changed) {
    writeStore(store, false);
  }
  return store;
}

function readStore(): SandboxStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SandboxStore;
      return sanitizeStore(parsed);
    }
  } catch {
    if (memoryFallback) return sanitizeStore(memoryFallback);
  }
  const initial = buildInitialStore();
  writeStore(initial, false);
  return initial;
}

function writeStore(next: SandboxStore, broadcast = true) {
  memoryFallback = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    try {
      const pruned = {
        ...next,
        topics: next.topics.map((t) => ({
          ...t,
          infographics: (t.infographics ?? []).map((info) => ({
            ...info,
            url: info.url.startsWith('data:') && info.url.length > 50000 ? `idb://topic-info-${info.id}` : info.url,
          })),
        })),
        resources: next.resources.map((r) => ({
          ...r,
          fileData: r.fileData && r.fileData.length > 50000 ? undefined : r.fileData,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    } catch {
      // Memory fallback retains full object in RAM
    }
  }
  if (broadcast) notifyAll();
}

function recordAudit(store: SandboxStore, actorId: string | undefined, tableName: string, operation: string, rowId?: string) {
  const nextId = (store.auditLogs[0]?.id ?? 0) + 1;
  store.auditLogs.unshift({
    id: nextId,
    actorId,
    tableName,
    operation,
    rowId,
    createdAt: new Date().toISOString(),
  });
  store.auditLogs = store.auditLogs.slice(0, 50);
}

function localRubricFallback(question: MainsQuestion, answerText: string): {
  score: number;
  feedback: string;
  evaluation: MainsEvaluation;
} {
  const words = countWords(answerText);
  const lower = answerText.toLowerCase();
  const matchedRefs = question.framework.statutoryOrDataRefs.filter((r) => {
    const token = r.toLowerCase().split(/\s+/).slice(0, 2).join(' ');
    return token.length > 3 && lower.includes(token);
  });
  const ratio = Math.min(1.15, words / Math.max(80, question.wordLimit));
  const refBonus = Math.min(2.5, matchedRefs.length * 0.9);
  const raw = Math.min(question.marks * 0.78, Math.max(2.5, ratio * (question.marks * 0.48) + refBonus));
  const score = Math.round(raw * 2) / 2;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (words >= Math.round(question.wordLimit * 0.7)) {
    strengths.push(`Maintained substantive analytical breadth (${words} words against ${question.wordLimit}-word limit).`);
  } else {
    improvements.push(`Expand multidimensional body arguments; ${words} words is concise for a ${question.marks}-mark response.`);
  }

  if (matchedRefs.length > 0) {
    strengths.push(`Anchored arguments with relevant constitutional/statutory citations (${matchedRefs.slice(0, 2).join(', ')}).`);
  } else {
    improvements.push(
      `Incorporate explicit constitutional or empirical anchors such as ${question.framework.statutoryOrDataRefs.slice(0, 2).join(' and ')}.`
    );
  }

  if (answerText.includes('\n')) {
    strengths.push('Clear paragraph separation improves examiner readability under UPSC Mains evaluation norms.');
  } else {
    improvements.push('Break dense prose into sub-headed dimensions (Context, Core Analysis, Way Forward).');
  }

  if (strengths.length === 0) {
    strengths.push('Addresses the central theme of the prompt directly without tangential drift.');
  }
  if (improvements.length === 0) {
    improvements.push('Conclude with 2–3 forward-looking institutional reforms linked to sustainable constitutional governance.');
  }

  return {
    score,
    feedback: `Evaluated against UPSC ${question.gsPaper} (${question.marks}-mark) rubric. Focus on sharper sub-headings, constitutional/statutory specificity, and a crisp reform-oriented conclusion.`,
    evaluation: { strengths, improvements },
  };
}

export const localRepo: DataRepo = {
  mode: 'sandbox',

  async getProfile(user) {
    const store = readStore();
    const isAdmin = user.role === 'admin';
    const existing = store.profiles[user.id];
    if (existing) {
      if (isAdmin && existing.role !== 'admin') {
        existing.role = 'admin';
        existing.displayName = existing.displayName || user.displayName || 'Faculty Director';
      }
      const normalized = normalizeProfile(existing);
      if (
        normalized.studyMinutes !== existing.studyMinutes ||
        normalized.streakDays !== existing.streakDays ||
        (isAdmin && normalized.role !== 'admin')
      ) {
        if (isAdmin) normalized.role = 'admin';
        store.profiles[user.id] = normalized;
        writeStore(store);
      }
      return normalized;
    }
    const created: UserProfileData = {
      uid: user.id,
      displayName: user.displayName || (isAdmin ? 'Faculty Director' : 'Aspirant'),
      email: user.email,
      photoURL: user.photoURL,
      targetYear: '2026',
      optionalSubject: isAdmin ? 'Public Administration' : 'Sociology',
      streakDays: 1,
      studyMinutes: 0,
      targetMinutes: 360,
      role: isAdmin ? 'admin' : (user.role || 'aspirant'),
      lastStudyDate: todayIST(),
    };
    store.profiles[user.id] = created;
    writeStore(store);
    return created;
  },

  async updateProfile(uid, patch: ProfilePatch) {
    const store = readStore();
    const cur = store.profiles[uid];
    if (!cur) throw new Error('Profile not found.');
    const updated: UserProfileData = {
      ...cur,
      ...(patch.displayName !== undefined ? { displayName: patch.displayName.trim() || cur.displayName } : {}),
      ...(patch.targetYear !== undefined ? { targetYear: patch.targetYear } : {}),
      ...(patch.optionalSubject !== undefined ? { optionalSubject: patch.optionalSubject.trim() } : {}),
      ...(patch.targetMinutes !== undefined ? { targetMinutes: patch.targetMinutes } : {}),
    };
    store.profiles[uid] = updated;
    writeStore(store);
    return normalizeProfile(updated);
  },

  async logStudyMinutes(uid, addedMinutes) {
    const store = readStore();
    const cur = store.profiles[uid];
    if (!cur) throw new Error('Profile not found.');
    const today = todayIST();
    const normalized = normalizeProfile(cur);
    const isNewDay = cur.lastStudyDate !== today;
    const updated: UserProfileData = {
      ...cur,
      studyMinutes: Math.min(1440, normalized.studyMinutes + addedMinutes),
      streakDays: isNewDay ? normalized.streakDays + 1 : Math.max(1, normalized.streakDays),
      lastStudyDate: today,
    };
    store.profiles[uid] = updated;
    writeStore(store);
    return updated;
  },

  async setSandboxRole(uid, role) {
    const store = readStore();
    const cur = store.profiles[uid];
    if (!cur) throw new Error('Profile not found.');
    const updated = { ...cur, role };
    store.profiles[uid] = updated;
    recordAudit(store, uid, 'profiles', 'ROLE_SWITCH', uid);
    writeStore(store);
    return normalizeProfile(updated);
  },

  async listBroadcasts() {
    const store = readStore();
    return [...store.broadcasts].sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  },

  async createBroadcast(payload: NewBroadcastPayload) {
    const store = readStore();
    const created: BroadcastClass = {
      id: makeId('broadcast'),
      ...payload,
      viewersCount: payload.status === 'live' ? 1 : 0,
      createdAt: new Date().toISOString(),
    };
    store.broadcasts.unshift(created);
    recordAudit(store, undefined, 'broadcast_classes', 'INSERT', created.id);
    writeStore(store);
    return created;
  },

  async updateBroadcast(id, patch) {
    const store = readStore();
    const idx = store.broadcasts.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Broadcast class not found.');
    const updated: BroadcastClass = { ...store.broadcasts[idx], ...patch };
    store.broadcasts[idx] = updated;
    recordAudit(store, undefined, 'broadcast_classes', 'UPDATE', id);
    writeStore(store);
    return updated;
  },

  async deleteBroadcast(id) {
    const store = readStore();
    store.broadcasts = store.broadcasts.filter((b) => b.id !== id);
    store.doubts = store.doubts.filter((d) => d.broadcastId !== id);
    store.notes = store.notes.filter((n) => n.broadcastId !== id);
    recordAudit(store, undefined, 'broadcast_classes', 'DELETE', id);
    writeStore(store);
  },

  subscribeBroadcasts(onChange: () => void): Unsubscribe {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  },

  joinClassroomPresence(broadcastId, _viewerKey, onCount): Unsubscribe {
    const store = readStore();
    const cls = store.broadcasts.find((b) => b.id === broadcastId);
    const base = cls?.status === 'live' ? Math.max(1, cls.viewersCount ?? 1) : 0;
    onCount(base);
    return () => {};
  },

  async listDoubts(broadcastId, viewerId) {
    const store = readStore();
    return store.doubts
      .filter((d) => d.broadcastId === broadcastId)
      .map((d) => ({
        ...d,
        userUpvoted: (store.upvotesByUser[d.id] ?? []).includes(viewerId),
      }))
      .sort((a, b) => b.upvotes - a.upvotes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async postDoubt(broadcastId, author, query) {
    const store = readStore();
    const doubt: LectureDoubt = {
      id: makeId('doubt'),
      broadcastId,
      userId: author.id,
      user: author.name,
      avatar: initials(author.name),
      query: query.trim(),
      upvotes: 0,
      isAnswered: false,
      createdAt: new Date().toISOString(),
      userUpvoted: false,
    };
    store.doubts.unshift(doubt);
    writeStore(store);
    return doubt;
  },

  async toggleDoubtUpvote(doubtId, viewerId) {
    const store = readStore();
    const doubt = store.doubts.find((d) => d.id === doubtId);
    if (!doubt) throw new Error('Doubt not found.');
    const voters = new Set(store.upvotesByUser[doubtId] ?? []);
    let upvoted = false;
    if (voters.has(viewerId)) {
      voters.delete(viewerId);
      doubt.upvotes = Math.max(0, doubt.upvotes - 1);
    } else {
      voters.add(viewerId);
      doubt.upvotes += 1;
      upvoted = true;
    }
    store.upvotesByUser[doubtId] = Array.from(voters);
    writeStore(store);
    return { upvotes: doubt.upvotes, upvoted };
  },

  async answerDoubt(doubtId, reply) {
    const store = readStore();
    const doubt = store.doubts.find((d) => d.id === doubtId);
    if (!doubt) throw new Error('Doubt not found.');
    const trimmed = reply.trim();
    doubt.facultyReply = trimmed || undefined;
    doubt.isAnswered = Boolean(trimmed);
    recordAudit(store, undefined, 'lecture_doubts', 'UPDATE', doubtId);
    writeStore(store);
    return { ...doubt };
  },

  async deleteDoubt(doubtId) {
    const store = readStore();
    store.doubts = store.doubts.filter((d) => d.id !== doubtId);
    delete store.upvotesByUser[doubtId];
    writeStore(store);
  },

  subscribeDoubts(_broadcastId, onChange): Unsubscribe {
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  },

  async listNotes(broadcastId, userId) {
    const store = readStore();
    return store.notes
      .filter((n) => n.broadcastId === broadcastId && n.userId === userId)
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  },

  async addNote(broadcastId, userId, timestampSeconds, text) {
    const store = readStore();
    const secs = Math.max(0, Math.floor(timestampSeconds));
    const note: LectureNote = {
      id: makeId('note'),
      broadcastId,
      userId,
      timestampSeconds: secs,
      formattedTime: formatClock(secs),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    store.notes.push(note);
    writeStore(store);
    return note;
  },

  async deleteNote(noteId) {
    const store = readStore();
    store.notes = store.notes.filter((n) => n.id !== noteId);
    writeStore(store);
  },

  async listQuizzes(includeDrafts) {
    const store = readStore();
    return store.quizzes.filter((q) => includeDrafts || q.isPublished);
  },

  async getQuizQuestions(quizId) {
    const store = readStore();
    const quiz = store.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found.');
    return quiz.questionIds
      .map((qid) => store.quizQuestions[qid])
      .filter((q): q is QuizQuestion => Boolean(q));
  },

  async importQuiz(payload: NewQuizImportPayload) {
    const store = readStore();
    const qIds: string[] = [];
    for (const q of payload.questions) {
      const id = makeId('qq');
      store.quizQuestions[id] = { id, ...q };
      qIds.push(id);
    }
    const quiz: Quiz = {
      id: makeId('quiz'),
      title: payload.title.trim(),
      gsPaper: payload.gsPaper,
      subject: payload.subject.trim(),
      testType: payload.testType,
      durationMinutes: payload.durationMinutes,
      questionIds: qIds,
      isPublished: payload.isPublished,
      createdAt: new Date().toISOString(),
    };
    store.quizzes.unshift(quiz);
    recordAudit(store, undefined, 'quizzes', 'INSERT', quiz.id);
    writeStore(store);
    return quiz;
  },

  async setQuizPublished(quizId, isPublished) {
    const store = readStore();
    const quiz = store.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found.');
    quiz.isPublished = isPublished;
    recordAudit(store, undefined, 'quizzes', 'UPDATE', quizId);
    writeStore(store);
    return { ...quiz };
  },

  async deleteQuiz(quizId) {
    const store = readStore();
    store.quizzes = store.quizzes.filter((q) => q.id !== quizId);
    recordAudit(store, undefined, 'quizzes', 'DELETE', quizId);
    writeStore(store);
  },

  async listAttempts(userId) {
    const store = readStore();
    return store.attempts
      .filter((a) => !a.userId || a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveAttempt(userId, payload: NewAttemptPayload) {
    const store = readStore();
    const pctRatio = payload.maxMarks > 0 ? Math.max(0, payload.score / payload.maxMarks) : 0;
    const percentile = Math.min(99.6, Math.round((48 + pctRatio * 50) * 10) / 10);
    const rec: TestAttemptRecord = {
      id: makeId('attempt'),
      userId,
      ...payload,
      percentile,
      createdAt: new Date().toISOString(),
    };
    store.attempts.unshift(rec);
    writeStore(store);
    return rec;
  },

  async listMainsQuestions() {
    const store = readStore();
    return [...store.mainsQuestions].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  },

  async createMainsQuestion(payload: NewMainsQuestionPayload) {
    const store = readStore();
    const created: MainsQuestion = {
      id: makeId('mains'),
      ...payload,
    };
    store.mainsQuestions.unshift(created);
    recordAudit(store, undefined, 'mains_questions', 'INSERT', created.id);
    writeStore(store);
    return created;
  },

  async deleteMainsQuestion(id) {
    const store = readStore();
    store.mainsQuestions = store.mainsQuestions.filter((q) => q.id !== id);
    recordAudit(store, undefined, 'mains_questions', 'DELETE', id);
    writeStore(store);
  },

  async listSubmissions(userId) {
    const store = readStore();
    return store.submissions
      .filter((s) => !userId || !s.userId || s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async listAllSubmissions() {
    const store = readStore();
    return [...store.submissions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async gradeMainsSubmission(submissionId, score, feedback, evaluation) {
    const store = readStore();
    const sub = store.submissions.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found.');
    sub.score = score;
    sub.feedback = feedback;
    sub.status = 'evaluated';
    if (evaluation) {
      sub.evaluation = evaluation;
    }
    writeStore(store);
    return { ...sub };
  },

  async submitAndEvaluateMains(userId, question, answerText) {
    const trimmed = answerText.trim();
    const words = countWords(trimmed);
    let score: number;
    let feedback: string;
    let evaluation: MainsEvaluation;

    try {
      const resp = await fetch('/api/mains/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answerText: trimmed }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = (await resp.json()) as {
        score: number;
        feedback: string;
        evaluation: MainsEvaluation;
      };
      score = body.score;
      feedback = body.feedback;
      evaluation = body.evaluation;
    } catch {
      const fb = localRubricFallback(question, trimmed);
      score = fb.score;
      feedback = fb.feedback;
      evaluation = fb.evaluation;
    }

    const store = readStore();
    const rec: MainsSubmissionRecord = {
      id: makeId('sub'),
      userId,
      questionId: question.id,
      questionPrompt: question.prompt,
      answerText: trimmed,
      wordCount: words,
      status: 'evaluated',
      score,
      maxMarks: question.marks,
      feedback,
      evaluation,
      createdAt: new Date().toISOString(),
    };
    store.submissions.unshift(rec);
    writeStore(store);
    return rec;
  },

  async listTopicsOfDay() {
    const store = readStore();
    return [...store.topics].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  },

  async publishTopicOfDay(payload: NewTopicPayload) {
    const store = readStore();
    const id = makeId('topic');
    let pdfBriefPath: string | undefined;
    let pdfBriefName = `${payload.title.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 48)}_Brief.md`;

    if (payload.briefFile) {
      pdfBriefName = payload.briefFile.name;
      pdfBriefPath = `sandbox://briefs/${id}/${payload.briefFile.name}`;
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        blobUrls.set(pdfBriefPath, URL.createObjectURL(payload.briefFile));
      }
    }

    const topic: TopicOfDay = {
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
      infographics: payload.infographics ?? [],
    };

    store.topics = [topic, ...store.topics.filter((t) => t.publishDate !== topic.publishDate)];
    recordAudit(store, undefined, 'topics_of_day', 'INSERT', topic.id);
    writeStore(store);
    return topic;
  },

  async deleteTopicOfDay(id) {
    const store = readStore();
    store.topics = store.topics.filter((t) => t.id !== id);
    recordAudit(store, undefined, 'topics_of_day', 'DELETE', id);
    writeStore(store);
  },

  async updateTopicInfographics(id: string, infographics: InfographicItem[]) {
    const store = readStore();
    const topic = store.topics.find((t) => t.id === id);
    if (!topic) throw new Error('Topic not found');
    topic.infographics = infographics;
    recordAudit(store, undefined, 'topics_of_day', 'UPDATE', id);
    writeStore(store);
    return { ...topic };
  },

  async openTopicBrief(topic) {
    const signedUrl = topic.pdfBriefPath ? blobUrls.get(topic.pdfBriefPath) ?? null : null;
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
    const store = readStore();
    return store.resources.filter(
      (r) => r.moderationStatus === 'approved' || r.uploadedBy === viewerId || isStaff
    );
  },

  async uploadResource(viewerId, isStaff, payload: NewResourcePayload) {
    const store = readStore();
    const id = makeId('res');
    let filePath: string | undefined;
    const sizeBytes = payload.file?.size ?? (payload.fileData ? Math.round(payload.fileData.length * 0.75) : 1_240_000);

    if (payload.file) {
      filePath = `sandbox://resources/${id}/${payload.file.name}`;
      void storeBlob(filePath, payload.file);
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        blobUrls.set(filePath, URL.createObjectURL(payload.file));
      }
    }

    const moderationStatus: ModerationStatus =
      isStaff && payload.autoApprove !== false ? 'approved' : 'pending';

    const safeFileData =
      payload.fileData && payload.fileData.length < 65536 ? payload.fileData : undefined;

    const item: ResourceItem = {
      id,
      title: payload.title.trim(),
      category: payload.category,
      gsPaper: payload.gsPaper,
      format: payload.format,
      sizeBytes,
      pages: payload.pages,
      downloads: 0,
      rating: 4.8,
      authorOrSource: payload.authorOrSource.trim(),
      summary: payload.summary.trim(),
      topicsCovered: payload.topicsCovered,
      filePath,
      fileData: safeFileData,
      isUserUploaded: !isStaff || payload.category === 'user',
      moderationStatus,
      uploadedBy: viewerId,
      createdAt: new Date().toISOString(),
    };

    store.resources.unshift(item);
    recordAudit(store, viewerId, 'resources', 'INSERT', item.id);
    writeStore(store);
    return item;
  },

  async setResourceModeration(id, status) {
    const store = readStore();
    const item = store.resources.find((r) => r.id === id);
    if (!item) throw new Error('Resource not found.');
    item.moderationStatus = status;
    recordAudit(store, undefined, 'resources', 'UPDATE', id);
    writeStore(store);
    return { ...item };
  },

  async deleteResource(id) {
    const store = readStore();
    const item = store.resources.find((r) => r.id === id);
    if (item?.filePath) {
      void deleteBlob(item.filePath);
      blobUrls.delete(item.filePath);
    }
    store.resources = store.resources.filter((r) => r.id !== id);
    recordAudit(store, undefined, 'resources', 'DELETE', id);
    writeStore(store);
  },

  async openResource(item) {
    const store = readStore();
    const found = store.resources.find((r) => r.id === item.id);
    if (found) {
      found.downloads += 1;
      writeStore(store);
    }
    const downloads = found ? found.downloads : item.downloads + 1;
    let signedUrl = item.filePath ? blobUrls.get(item.filePath) ?? null : null;
    if (!signedUrl && item.filePath) {
      const persistedBlob = await getBlob(item.filePath);
      if (persistedBlob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        signedUrl = URL.createObjectURL(persistedBlob);
        blobUrls.set(item.filePath, signedUrl);
      }
    }
    const imageUrl =
      item.format === 'jpg' || item.format === 'png'
        ? item.fileData || signedUrl || null
        : null;
    const md = buildResourceSynopsisMarkdown(item);
    const safeSlug = item.title.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 48);
    const ext = item.format === 'pdf' ? 'pdf' : item.format === 'jpg' ? 'jpg' : item.format === 'png' ? 'png' : 'md';

    return {
      downloads,
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
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  },

  async loadSyllabus(userId) {
    const store = readStore();
    const seed = buildSeed();
    const done = new Set(store.completedSubtopics[userId] ?? []);
    return seed.syllabus.map((paper) => ({
      paper: paper.paper,
      title: paper.title,
      subtopics: paper.subtopics.map((st) => ({
        ...st,
        completed: done.has(st.id),
      })),
    }));
  },

  async setSubtopicCompleted(userId, subtopicId, completed) {
    const store = readStore();
    const done = new Set(store.completedSubtopics[userId] ?? []);
    if (completed) done.add(subtopicId);
    else done.delete(subtopicId);
    store.completedSubtopics[userId] = Array.from(done);
    writeStore(store);
  },

  async listAllProfiles() {
    const store = readStore();
    return Object.values(store.profiles).map((p) => normalizeProfile(p));
  },

  async setUserRole(targetUid, role: UserRole) {
    const store = readStore();
    const p = store.profiles[targetUid];
    if (!p) throw new Error('Target profile not found.');
    p.role = role;
    recordAudit(store, undefined, 'profiles', 'SET_ROLE', targetUid);
    writeStore(store);
  },

  async listAuditLogs(limit = 25) {
    const store = readStore();
    return store.auditLogs.slice(0, limit);
  },
};
