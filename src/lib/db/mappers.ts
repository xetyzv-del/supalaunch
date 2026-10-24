import type {
  AdminAuditEntry,
  BroadcastClass,
  LectureDoubt,
  LectureNote,
  MainsQuestion,
  MainsSubmissionRecord,
  Quiz,
  QuizQuestion,
  ResourceItem,
  SyllabusPaper,
  SyllabusSubtopic,
  TestAttemptRecord,
  TopicOfDay,
  UserProfileData,
} from '../../types/index.ts';

export interface TableSpec<T> {
  table: string;
  fields: { [K in keyof T]?: string };
  generated?: (keyof T)[];
  readOnly?: (keyof T)[];
  virtual?: (keyof T)[];
  nullable?: (keyof T)[];
  extraColumns?: string[];
}

export const profileSpec: TableSpec<UserProfileData> = {
  table: 'profiles',
  fields: {
    uid: 'id',
    displayName: 'display_name',
    email: 'email',
    photoURL: 'photo_url',
    targetYear: 'target_year',
    optionalSubject: 'optional_subject',
    streakDays: 'streak_days',
    studyMinutes: 'study_minutes',
    targetMinutes: 'target_minutes',
    role: 'role',
    lastStudyDate: 'last_study_date',
  },
  readOnly: ['uid', 'email', 'streakDays', 'studyMinutes', 'role', 'lastStudyDate'],
  extraColumns: ['created_at', 'updated_at'],
};

export const broadcastSpec: TableSpec<BroadcastClass> = {
  table: 'broadcast_classes',
  fields: {
    id: 'id',
    title: 'title',
    subject: 'subject',
    faculty: 'faculty',
    facultyDesignation: 'faculty_designation',
    source: 'source',
    streamUrl: 'stream_url',
    scheduledAt: 'scheduled_at',
    durationMinutes: 'duration_minutes',
    status: 'status',
    description: 'description',
    topicsCovered: 'topics_covered',
    handoutUrl: 'handout_url',
    handoutTitle: 'handout_title',
    thumbnail: 'thumbnail',
    viewersCount: 'viewers_count',
    meetingId: 'meeting_id',
    meetingPassword: 'meeting_password',
    chatEnabled: 'chat_enabled',
    createdAt: 'created_at',
  },
  readOnly: ['createdAt'],
  extraColumns: ['created_by', 'updated_at'],
};

export const doubtSpec: TableSpec<LectureDoubt> = {
  table: 'lecture_doubts',
  fields: {
    id: 'id',
    broadcastId: 'broadcast_id',
    userId: 'user_id',
    user: 'user_name',
    avatar: 'avatar',
    query: 'query',
    upvotes: 'upvotes',
    isAnswered: 'is_answered',
    facultyReply: 'faculty_reply',
    createdAt: 'created_at',
  },
  generated: ['isAnswered'],
  readOnly: ['id', 'userId', 'user', 'avatar', 'upvotes', 'createdAt'],
  virtual: ['userUpvoted'],
};

export const noteSpec: TableSpec<LectureNote> = {
  table: 'lecture_notes',
  fields: {
    id: 'id',
    broadcastId: 'broadcast_id',
    userId: 'user_id',
    timestampSeconds: 'timestamp_seconds',
    formattedTime: 'formatted_time',
    text: 'text',
    createdAt: 'created_at',
  },
  generated: ['formattedTime'],
  readOnly: ['id', 'userId', 'createdAt'],
};

export const questionSpec: TableSpec<QuizQuestion> = {
  table: 'quiz_questions',
  fields: {
    id: 'id',
    subject: 'subject',
    topic: 'topic',
    gsPaper: 'gs_paper',
    questionEn: 'question_en',
    questionHi: 'question_hi',
    statementsEn: 'statements_en',
    statementsHi: 'statements_hi',
    optionsEn: 'options_en',
    optionsHi: 'options_hi',
    correctIndex: 'correct_index',
    explanationEn: 'explanation_en',
    explanationHi: 'explanation_hi',
    sourceBook: 'source_book',
  },
  extraColumns: ['created_by', 'created_at', 'updated_at'],
};

export const quizSpec: TableSpec<Quiz> = {
  table: 'quizzes',
  fields: {
    id: 'id',
    title: 'title',
    gsPaper: 'gs_paper',
    subject: 'subject',
    testType: 'test_type',
    durationMinutes: 'duration_minutes',
    isPublished: 'is_published',
    createdBy: 'created_by',
    createdAt: 'created_at',
  },
  readOnly: ['createdBy', 'createdAt'],
  virtual: ['questionIds'],
  extraColumns: ['updated_at'],
};

export const attemptSpec: TableSpec<TestAttemptRecord> = {
  table: 'test_attempts',
  fields: {
    id: 'id',
    userId: 'user_id',
    testId: 'test_id',
    testTitle: 'test_title',
    score: 'score',
    maxMarks: 'max_marks',
    accuracy: 'accuracy',
    percentile: 'percentile',
    correct: 'correct',
    incorrect: 'incorrect',
    unattempted: 'unattempted',
    timeTakenSeconds: 'time_taken_seconds',
    subjectWise: 'subject_wise',
    createdAt: 'created_at',
  },
  generated: ['percentile'],
  readOnly: ['id', 'userId', 'createdAt'],
  nullable: ['percentile'],
};

export const mainsQuestionSpec: TableSpec<MainsQuestion> = {
  table: 'mains_questions',
  fields: {
    id: 'id',
    title: 'title',
    gsPaper: 'gs_paper',
    subject: 'subject',
    marks: 'marks',
    wordLimit: 'word_limit',
    prompt: 'prompt',
    suggestedTimeMin: 'suggested_time_min',
    framework: 'framework',
    modelAnswerSnippet: 'model_answer_snippet',
    publishDate: 'publish_date',
  },
  extraColumns: ['created_by', 'created_at', 'updated_at'],
};

export const mainsSubmissionSpec: TableSpec<MainsSubmissionRecord> = {
  table: 'mains_submissions',
  fields: {
    id: 'id',
    userId: 'user_id',
    questionId: 'question_id',
    questionPrompt: 'question_prompt',
    answerText: 'answer_text',
    wordCount: 'word_count',
    status: 'status',
    score: 'score',
    maxMarks: 'max_marks',
    feedback: 'feedback',
    evaluation: 'evaluation',
    createdAt: 'created_at',
  },
  readOnly: ['id', 'userId', 'status', 'score', 'feedback', 'evaluation', 'createdAt'],
  nullable: ['score'],
};

export const topicSpec: TableSpec<TopicOfDay> = {
  table: 'topics_of_day',
  fields: {
    id: 'id',
    title: 'title',
    category: 'category',
    source: 'source',
    publishDate: 'publish_date',
    readTimeMinutes: 'read_time_minutes',
    gsPaper: 'gs_paper',
    summaryBullets: 'summary_bullets',
    keyArticlesOrData: 'key_articles_or_data',
    mindmapNodes: 'mindmap_nodes',
    pdfBriefName: 'pdf_brief_name',
    pdfBriefPath: 'pdf_brief_path',
  },
  extraColumns: ['created_by', 'created_at', 'updated_at'],
};

export const resourceSpec: TableSpec<ResourceItem> = {
  table: 'resources',
  fields: {
    id: 'id',
    title: 'title',
    category: 'category',
    gsPaper: 'gs_paper',
    format: 'format',
    sizeBytes: 'size_bytes',
    pages: 'pages',
    downloads: 'downloads',
    rating: 'rating',
    authorOrSource: 'author_or_source',
    summary: 'summary',
    topicsCovered: 'topics_covered',
    filePath: 'file_path',
    isUserUploaded: 'is_user_uploaded',
    moderationStatus: 'moderation_status',
    uploadedBy: 'uploaded_by',
    createdAt: 'created_at',
  },
  readOnly: ['id', 'downloads', 'isUserUploaded', 'uploadedBy', 'createdAt'],
  nullable: ['pages'],
  extraColumns: ['updated_at'],
};

export const syllabusPaperSpec: TableSpec<Omit<SyllabusPaper, 'subtopics'>> = {
  table: 'syllabus_papers',
  fields: { paper: 'paper', title: 'title' },
  extraColumns: ['position'],
};

export const syllabusSubtopicSpec: TableSpec<SyllabusSubtopic> = {
  table: 'syllabus_subtopics',
  fields: { id: 'id', name: 'name', importance: 'importance' },
  virtual: ['completed'],
  extraColumns: ['paper', 'position'],
};

export const auditLogSpec: TableSpec<AdminAuditEntry> = {
  table: 'admin_audit_log',
  fields: {
    id: 'id',
    actorId: 'actor_id',
    tableName: 'table_name',
    operation: 'operation',
    rowId: 'row_id',
    createdAt: 'created_at',
  },
  readOnly: ['id', 'actorId', 'tableName', 'operation', 'rowId', 'createdAt'],
  extraColumns: ['old_row', 'new_row'],
};

export const SUPPORT_TABLES: Record<string, string[]> = {
  quiz_question_links: ['quiz_id', 'question_id', 'position'],
  doubt_upvotes: ['doubt_id', 'user_id', 'created_at'],
  syllabus_progress: ['user_id', 'subtopic_id', 'completed_at'],
  study_logs: ['user_id', 'log_date', 'minutes'],
  admin_audit_log: ['id', 'actor_id', 'table_name', 'operation', 'row_id', 'old_row', 'new_row', 'created_at'],
};

export const ALL_SPECS: TableSpec<any>[] = [
  profileSpec,
  broadcastSpec,
  doubtSpec,
  noteSpec,
  questionSpec,
  quizSpec,
  attemptSpec,
  mainsQuestionSpec,
  mainsSubmissionSpec,
  topicSpec,
  resourceSpec,
  syllabusPaperSpec,
  syllabusSubtopicSpec,
];

export function fromRow<T>(spec: TableSpec<T>, row: Record<string, any>): T {
  const out: Record<string, any> = {};
  const nullable = new Set<string>((spec.nullable ?? []) as string[]);
  for (const [field, column] of Object.entries(spec.fields) as [string, string][]) {
    if (!(column in row)) continue;
    const v = row[column];
    if (v === null || v === undefined) {
      if (nullable.has(field)) out[field] = null;
    } else {
      if (
        typeof v === 'string' &&
        ['score', 'maxMarks', 'accuracy', 'percentile', 'rating', 'sizeBytes'].includes(field)
      ) {
        const parsed = Number(v);
        out[field] = Number.isNaN(parsed) ? v : parsed;
      } else {
        out[field] = v;
      }
    }
  }
  return out as T;
}

export function toRow<T>(
  spec: TableSpec<T>,
  obj: Partial<T>,
  opts: { allowReadOnly?: (keyof T)[] } = {}
): Record<string, any> {
  const blocked = new Set<string>([
    ...((spec.generated ?? []) as string[]),
    ...((spec.virtual ?? []) as string[]),
    ...(((spec.readOnly ?? []) as string[]).filter(
      (f) => !(opts.allowReadOnly as string[] | undefined)?.includes(f)
    )),
  ]);
  const out: Record<string, any> = {};
  for (const [field, column] of Object.entries(spec.fields) as [string, string][]) {
    if (blocked.has(field)) continue;
    const v = (obj as Record<string, any>)[field];
    if (v === undefined) continue;
    out[column] = v;
  }
  return out;
}

export function selectColumns<T>(spec: TableSpec<T>): string {
  return Object.values(spec.fields).join(',');
}
