import type {
  AdminAuditEntry,
  BroadcastClass,
  GSBadge,
  InfographicItem,
  LectureDoubt,
  LectureNote,
  MainsQuestion,
  MainsSubmissionRecord,
  ModerationStatus,
  Quiz,
  QuizQuestion,
  ResourceCategory,
  ResourceFormat,
  ResourceItem,
  SyllabusPaper,
  TestAttemptRecord,
  TestType,
  TopicOfDay,
  UserProfileData,
  UserRole,
} from '../../types';

export type Unsubscribe = () => void;

export interface ProfilePatch {
  displayName?: string;
  targetYear?: UserProfileData['targetYear'];
  optionalSubject?: string;
  targetMinutes?: number;
}

export interface NewBroadcastPayload {
  title: string;
  subject: GSBadge;
  faculty: string;
  facultyDesignation?: string;
  source: BroadcastClass['source'];
  streamUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: BroadcastClass['status'];
  description?: string;
  topicsCovered: string[];
  handoutUrl?: string;
  handoutTitle?: string;
  meetingId?: string;
  meetingPassword?: string;
  chatEnabled?: boolean;
}

export type NewQuizQuestion = Omit<QuizQuestion, 'id'>;

export interface NewQuizImportPayload {
  title: string;
  gsPaper: GSBadge;
  subject: string;
  testType: TestType;
  durationMinutes: number;
  isPublished: boolean;
  questions: NewQuizQuestion[];
}

export interface NewAttemptPayload {
  testId: string;
  testTitle: string;
  score: number;
  maxMarks: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeTakenSeconds: number;
  subjectWise: TestAttemptRecord['subjectWise'];
}

export interface NewMainsQuestionPayload {
  title: string;
  gsPaper: GSBadge;
  subject: string;
  marks: number;
  wordLimit: number;
  prompt: string;
  suggestedTimeMin: number;
  framework: MainsQuestion['framework'];
  modelAnswerSnippet: string;
  publishDate: string;
}

export interface NewTopicPayload {
  title: string;
  category: string;
  source: string;
  publishDate: string;
  readTimeMinutes: number;
  gsPaper: GSBadge;
  summaryBullets: string[];
  keyArticlesOrData: { label: string; value: string }[];
  mindmapNodes: TopicOfDay['mindmapNodes'];
  briefFile?: File | null;
  infographics?: InfographicItem[];
}

export interface NewResourcePayload {
  title: string;
  category: ResourceCategory;
  gsPaper: GSBadge;
  format: ResourceFormat;
  pages: number | null;
  authorOrSource: string;
  summary: string;
  topicsCovered: string[];
  file?: File | null;
  fileData?: string;
  autoApprove?: boolean;
}

export interface DocumentOpenPayload {
  title: string;
  subtitle: string;
  signedUrl?: string | null;
  imageUrl?: string | null;
  format?: ResourceFormat | 'md';
  markdownContent: string;
  downloadFilename: string;
}

export interface DataRepo {
  readonly mode: 'supabase' | 'sandbox';

  getProfile(user: { id: string; email: string; displayName: string; photoURL?: string; role?: UserRole }): Promise<UserProfileData>;
  updateProfile(uid: string, patch: ProfilePatch): Promise<UserProfileData>;
  logStudyMinutes(uid: string, addedMinutes: number): Promise<UserProfileData>;
  setSandboxRole?(uid: string, role: UserRole): Promise<UserProfileData>;

  listBroadcasts(): Promise<BroadcastClass[]>;
  createBroadcast(payload: NewBroadcastPayload): Promise<BroadcastClass>;
  updateBroadcast(id: string, patch: Partial<BroadcastClass>): Promise<BroadcastClass>;
  deleteBroadcast(id: string): Promise<void>;
  subscribeBroadcasts(onChange: () => void): Unsubscribe;
  joinClassroomPresence(broadcastId: string, viewerKey: string, onCount: (count: number) => void): Unsubscribe;

  listDoubts(broadcastId: string, viewerId: string): Promise<LectureDoubt[]>;
  postDoubt(broadcastId: string, author: { id: string; name: string }, query: string): Promise<LectureDoubt>;
  toggleDoubtUpvote(doubtId: string, viewerId: string): Promise<{ upvotes: number; upvoted: boolean }>;
  answerDoubt(doubtId: string, reply: string): Promise<LectureDoubt>;
  deleteDoubt(doubtId: string): Promise<void>;
  subscribeDoubts(broadcastId: string, onChange: () => void): Unsubscribe;

  listNotes(broadcastId: string, userId: string): Promise<LectureNote[]>;
  addNote(broadcastId: string, userId: string, timestampSeconds: number, text: string): Promise<LectureNote>;
  deleteNote(noteId: string): Promise<void>;

  listQuizzes(includeDrafts: boolean): Promise<Quiz[]>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  importQuiz(payload: NewQuizImportPayload): Promise<Quiz>;
  setQuizPublished(quizId: string, isPublished: boolean): Promise<Quiz>;
  deleteQuiz(quizId: string): Promise<void>;
  listAttempts(userId: string): Promise<TestAttemptRecord[]>;
  saveAttempt(userId: string, payload: NewAttemptPayload): Promise<TestAttemptRecord>;

  listMainsQuestions(): Promise<MainsQuestion[]>;
  createMainsQuestion(payload: NewMainsQuestionPayload): Promise<MainsQuestion>;
  deleteMainsQuestion(id: string): Promise<void>;
  listSubmissions(userId: string): Promise<MainsSubmissionRecord[]>;
  listAllSubmissions?(): Promise<MainsSubmissionRecord[]>;
  gradeMainsSubmission?(
    submissionId: string,
    score: number,
    feedback: string,
    evaluation?: { strengths: string[]; improvements: string[] }
  ): Promise<MainsSubmissionRecord>;
  submitAndEvaluateMains(
    userId: string,
    question: MainsQuestion,
    answerText: string
  ): Promise<MainsSubmissionRecord>;

  listTopicsOfDay(): Promise<TopicOfDay[]>;
  publishTopicOfDay(payload: NewTopicPayload): Promise<TopicOfDay>;
  deleteTopicOfDay(id: string): Promise<void>;
  updateTopicInfographics(id: string, infographics: InfographicItem[]): Promise<TopicOfDay>;
  openTopicBrief(topic: TopicOfDay): Promise<DocumentOpenPayload>;

  listResources(viewerId: string, isStaff: boolean): Promise<ResourceItem[]>;
  uploadResource(viewerId: string, isStaff: boolean, payload: NewResourcePayload): Promise<ResourceItem>;
  setResourceModeration(id: string, status: ModerationStatus): Promise<ResourceItem>;
  deleteResource(id: string): Promise<void>;
  openResource(item: ResourceItem): Promise<{ doc: DocumentOpenPayload; downloads: number }>;
  subscribeResources(onChange: () => void): Unsubscribe;

  loadSyllabus(userId: string): Promise<SyllabusPaper[]>;
  setSubtopicCompleted(userId: string, subtopicId: string, completed: boolean): Promise<void>;

  listAllProfiles(): Promise<UserProfileData[]>;
  setUserRole(targetUid: string, role: UserRole): Promise<void>;
  listAuditLogs(limit?: number): Promise<AdminAuditEntry[]>;
}
