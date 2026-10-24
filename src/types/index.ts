export const GS_BADGES = ['GS-1', 'GS-2', 'GS-3', 'GS-4', 'CSAT', 'Current Affairs', 'Essay', 'Optional'] as const;
export const BROADCAST_SOURCES = ['youtube', 'meet', 'zoom', 'hls', 'vimeo', 'custom'] as const;
export const BROADCAST_STATUSES = ['live', 'scheduled', 'completed'] as const;
export const USER_ROLES = ['aspirant', 'mentor', 'admin'] as const;
export const TARGET_YEARS = ['2026', '2027', '2028'] as const;
export const RESOURCE_CATEGORIES = ['ncert', 'standard', 'yojana', 'pib', 'pyq', 'user'] as const;
export const RESOURCE_FORMATS = ['pdf', 'jpg', 'png', 'epub'] as const;
export const MODERATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export const TEST_TYPES = ['mock_test', 'mcq_drill', 'topic_quiz'] as const;
export const SYLLABUS_IMPORTANCES = ['High Priority', 'Core Standard', 'Frequent PYQs'] as const;
export const EVALUATION_STATUSES = ['pending', 'evaluated', 'failed'] as const;

export type GSBadge = (typeof GS_BADGES)[number];
export type BroadcastSource = (typeof BROADCAST_SOURCES)[number];
export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type TargetYear = (typeof TARGET_YEARS)[number];
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type ResourceFormat = (typeof RESOURCE_FORMATS)[number];
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
export type TestType = (typeof TEST_TYPES)[number];
export type SyllabusImportance = (typeof SYLLABUS_IMPORTANCES)[number];
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  targetYear: TargetYear;
  optionalSubject: string;
  streakDays: number;
  studyMinutes: number;
  targetMinutes: number;
  role: UserRole;
  lastStudyDate?: string;
}

export interface BroadcastClass {
  id: string;
  title: string;
  subject: GSBadge;
  faculty: string;
  facultyDesignation?: string;
  source: BroadcastSource;
  streamUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: BroadcastStatus;
  description?: string;
  topicsCovered: string[];
  handoutUrl?: string;
  handoutTitle?: string;
  thumbnail?: string;
  viewersCount?: number;
  meetingId?: string;
  meetingPassword?: string;
  chatEnabled?: boolean;
  createdAt?: string;
}

export interface LectureDoubt {
  id: string;
  broadcastId: string;
  userId: string;
  user: string;
  avatar: string;
  query: string;
  upvotes: number;
  isAnswered: boolean;
  facultyReply?: string;
  createdAt: string;
  userUpvoted?: boolean;
}

export interface LectureNote {
  id: string;
  broadcastId: string;
  userId: string;
  timestampSeconds: number;
  formattedTime: string;
  text: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  topic: string;
  gsPaper: GSBadge;
  questionEn: string;
  questionHi: string;
  statementsEn?: string[];
  statementsHi?: string[];
  optionsEn: string[];
  optionsHi: string[];
  correctIndex: number;
  explanationEn: string;
  explanationHi: string;
  sourceBook: string;
}

export interface Quiz {
  id: string;
  title: string;
  gsPaper: GSBadge;
  subject: string;
  testType: TestType;
  durationMinutes: number;
  questionIds: string[];
  isPublished: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface SubjectScore {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  marks: number;
}

export interface TestResult {
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  totalMarks: number;
  maxMarks: number;
  accuracy: number;
  timeTakenSeconds: number;
  subjectWise: SubjectScore[];
}

export interface TestAttemptRecord {
  id: string;
  userId?: string;
  testId: string;
  testTitle: string;
  score: number;
  maxMarks: number;
  accuracy: number;
  percentile: number | null;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeTakenSeconds: number;
  subjectWise: SubjectScore[];
  createdAt: string;
}

export interface MainsDimension {
  title: string;
  points: string[];
}

export interface MainsFramework {
  intro: string;
  dimensions: MainsDimension[];
  statutoryOrDataRefs: string[];
  wayForward: string[];
  conclusion: string;
}

export interface MainsQuestion {
  id: string;
  title: string;
  gsPaper: GSBadge;
  subject: string;
  marks: number;
  wordLimit: number;
  prompt: string;
  suggestedTimeMin: number;
  framework: MainsFramework;
  modelAnswerSnippet: string;
  publishDate: string;
}

export interface MainsEvaluation {
  strengths: string[];
  improvements: string[];
}

export interface MainsSubmissionRecord {
  id: string;
  userId?: string;
  questionId: string;
  questionPrompt: string;
  answerText: string;
  wordCount: number;
  status: EvaluationStatus;
  score: number | null;
  maxMarks: number;
  feedback: string;
  evaluation?: MainsEvaluation;
  createdAt: string;
}

export interface MindMapNode {
  title: string;
  color: string;
  items: string[];
}

export interface InfographicItem {
  id: string;
  url: string;
  title: string;
  caption?: string;
  source?: string;
  uploadedAt?: string;
}

export interface TopicOfDay {
  id: string;
  title: string;
  category: string;
  source: string;
  publishDate: string;
  readTimeMinutes: number;
  gsPaper: GSBadge;
  summaryBullets: string[];
  keyArticlesOrData: { label: string; value: string }[];
  mindmapNodes: MindMapNode[];
  pdfBriefName: string;
  pdfBriefPath?: string;
  infographics?: InfographicItem[];
}

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  gsPaper: GSBadge;
  format: ResourceFormat;
  sizeBytes: number;
  pages: number | null;
  downloads: number;
  rating: number;
  authorOrSource: string;
  summary: string;
  topicsCovered: string[];
  filePath?: string;
  fileData?: string;
  isUserUploaded: boolean;
  moderationStatus: ModerationStatus;
  uploadedBy?: string;
  createdAt?: string;
}

export interface SyllabusSubtopic {
  id: string;
  name: string;
  importance: SyllabusImportance;
  completed: boolean;
}

export interface SyllabusPaper {
  paper: GSBadge;
  title: string;
  subtopics: SyllabusSubtopic[];
}

export interface AdminAuditEntry {
  id: number;
  actorId?: string;
  tableName: string;
  operation: string;
  rowId?: string;
  createdAt: string;
}
