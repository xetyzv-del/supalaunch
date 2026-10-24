import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storeBlob } from '../lib/db/blobStore';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Tv,
  Upload,
  UserCheck,
  Users,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import type { DataRepo, NewQuizImportPayload, NewTopicPayload } from '../lib/db/repo';
import { parsePipeDelimitedQuizCsv, samplePipeDelimitedCsv } from '../lib/quizCsv';
import { formatDateTimeIST, istInputToIso } from '../lib/format';
import type {
  AdminAuditEntry,
  BroadcastClass,
  GSBadge,
  InfographicItem,
  MainsQuestion,
  MainsSubmissionRecord,
  ModerationStatus,
  Quiz,
  ResourceCategory,
  ResourceFormat,
  ResourceItem,
  TopicOfDay,
  UserProfileData,
} from '../types';
import { GS_BADGES, RESOURCE_CATEGORIES } from '../types';
import { UploadResourceModal } from './UploadResourceModal';

export type AdminDashboardTab =
  | 'overview'
  | 'mains'
  | 'broadcasts'
  | 'crux'
  | 'quiz'
  | 'resources'
  | 'cohort';

interface AdminDashboardProps {
  repo: DataRepo;
  profile: UserProfileData;
  topics: TopicOfDay[];
  broadcasts: BroadcastClass[];
  quizzes: Quiz[];
  mainsQuestions: MainsQuestion[];
  submissions: MainsSubmissionRecord[];
  resources: ResourceItem[];
  onOpenBroadcastScheduler: () => void;
  onRefreshAll: () => Promise<void> | void;
  onSelectBroadcast?: (b: BroadcastClass) => void;
  onOpenResourceDoc?: (item: ResourceItem) => void;
  onOpenTopicBrief?: (t: TopicOfDay) => void;
}

export function AdminDashboard({
  repo,
  profile,
  topics,
  broadcasts,
  quizzes,
  mainsQuestions,
  submissions,
  resources,
  onOpenBroadcastScheduler,
  onRefreshAll,
  onSelectBroadcast,
  onOpenResourceDoc,
  onOpenTopicBrief,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('overview');
  const [uploadResourceOpen, setUploadResourceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mains Evaluation Desk State
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<MainsSubmissionRecord | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(8.5);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [gradingStrengths, setGradingStrengths] = useState<string>('Strong constitutional grounding\nDirect addressal of demand');
  const [gradingImprovements, setGradingImprovements] = useState<string>('Include recent Law Commission recommendations\nEnhance flowchart clarity');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingSuccess, setGradingSuccess] = useState<string | null>(null);

  // Daily Crux Form State
  const [cruxTitle, setCruxTitle] = useState('');
  const [cruxCategory, setCruxCategory] = useState('Constitutional & Statutory Bodies');
  const [cruxGsPaper, setCruxGsPaper] = useState<GSBadge>('GS-2');
  const [cruxSource, setCruxSource] = useState('The Hindu / Press Information Bureau');
  const [cruxReadTime, setCruxReadTime] = useState(6);
  const [cruxBullets, setCruxBullets] = useState(
    '• Constitutional mandate under Article 280 requires periodic Finance Commission review.\n• Horizontal devolution formula balances fiscal need and demographic performance.\n• State fiscal space constrained by cess and surcharge expansions.'
  );
  const [cruxArticles, setCruxArticles] = useState(
    'Article 280 : Finance Commission Mandate\nArticle 270 : Divisible Tax Pool\n41% : Recommended Vertical Devolution'
  );
  const [cruxUploadMode, setCruxUploadMode] = useState<'file' | 'url'>('file');
  const [cruxImageFile, setCruxImageFile] = useState<File | null>(null);
  const [cruxImagePreview, setCruxImagePreview] = useState<string | null>(null);
  const [cruxImageName, setCruxImageName] = useState<string>('');
  const [cruxImageSize, setCruxImageSize] = useState<string>('');
  const [cruxInfographicUrl, setCruxInfographicUrl] = useState('');
  const [cruxInfographicTitle, setCruxInfographicTitle] = useState('');
  const [cruxInfographicCaption, setCruxInfographicCaption] = useState('Editorial mindmap & key conceptual flowchart');
  const cruxFileInputRef = useRef<HTMLInputElement>(null);
  const [isPublishingCrux, setIsPublishingCrux] = useState(false);
  const [cruxPublishSuccess, setCruxPublishSuccess] = useState<string | null>(null);

  // Attach infographic to existing topic modal state
  const [topicForInfographic, setTopicForInfographic] = useState<TopicOfDay | null>(null);
  const [existingTopicImageFile, setExistingTopicImageFile] = useState<File | null>(null);
  const [existingTopicImagePreview, setExistingTopicImagePreview] = useState<string | null>(null);
  const [existingTopicImageName, setExistingTopicImageName] = useState<string>('');
  const [existingTopicImageUrl, setExistingTopicImageUrl] = useState<string>('');
  const [existingTopicImageTitle, setExistingTopicImageTitle] = useState<string>('');
  const [existingTopicImageCaption, setExistingTopicImageCaption] = useState<string>('');
  const [existingTopicUploadMode, setExistingTopicUploadMode] = useState<'file' | 'url'>('file');
  const [isAddingInfographicToTopic, setIsAddingInfographicToTopic] = useState<boolean>(false);
  const existingTopicFileInputRef = useRef<HTMLInputElement>(null);

  // Prelims CSV Importer State
  const [csvText, setCsvText] = useState<string>(samplePipeDelimitedCsv);
  const [quizTitle, setQuizTitle] = useState('GS-2 Prelims Diagnostic Mini-Mock');
  const [quizPaper, setQuizPaper] = useState<GSBadge>('GS-2');
  const [quizSubject, setQuizSubject] = useState('Indian Polity & Governance');
  const [quizDuration, setQuizDuration] = useState(25);
  const [isImportingQuiz, setIsImportingQuiz] = useState(false);
  const [quizImportResult, setQuizImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cohortProfiles, setCohortProfiles] = useState<UserProfileData[]>([]);

  // Parse CSV
  const parseResult = parsePipeDelimitedQuizCsv(csvText, quizPaper, quizSubject);

  useEffect(() => {
    let active = true;
    if (repo.listAllProfiles) {
      repo.listAllProfiles().then((profs) => {
        if (active) setCohortProfiles(profs);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [repo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshAll();
      if (repo.listAllProfiles) {
        const profs = await repo.listAllProfiles();
        setCohortProfiles(profs);
      }
    } finally {
      setRefreshing(false);
    }
  };

  interface CohortDisplayRow {
    name: string;
    email: string;
    year: string;
    opt: string;
    streak: number;
    mins: number;
    status: string;
  }

  const enrolledAspirants = useMemo(() => {
    return cohortProfiles.filter((p) => p.role !== 'admin' && p.email !== profile.email);
  }, [cohortProfiles, profile.email]);

  const enrolledCount = enrolledAspirants.length;

  const displayCohortRows: CohortDisplayRow[] = useMemo(() => {
    return enrolledAspirants.map((p) => ({
      name: p.displayName || 'Aspirant',
      email: p.email || 'aspirant@civiledge.in',
      year: String(p.targetYear || '2026'),
      opt: p.optionalSubject || 'General Studies',
      streak: p.streakDays || 1,
      mins: p.studyMinutes || 0,
      status: p.streakDays > 14 ? 'Top Performer' : p.streakDays > 7 ? 'Consistent' : 'Active Aspirant',
    }));
  }, [enrolledAspirants]);

  const handleStartGrading = (sub: MainsSubmissionRecord) => {
    setEvaluatingSubmission(sub);
    setGradingScore(sub.score || Math.round(sub.maxMarks * 0.55 * 10) / 10);
    setGradingFeedback(sub.feedback || `Evaluated against UPSC ${sub.maxMarks}-mark evaluation rubric. Commendable structure and clarity of thought.`);
    if (sub.evaluation) {
      setGradingStrengths(sub.evaluation.strengths.join('\n'));
      setGradingImprovements(sub.evaluation.improvements.join('\n'));
    }
    setGradingSuccess(null);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSubmission) return;
    setIsGrading(true);
    setGradingSuccess(null);
    try {
      const strengthsArr = gradingStrengths.split('\n').map((s) => s.trim()).filter(Boolean);
      const improvementsArr = gradingImprovements.split('\n').map((s) => s.trim()).filter(Boolean);

      if (repo.gradeMainsSubmission) {
        await repo.gradeMainsSubmission(
          evaluatingSubmission.id,
          gradingScore,
          gradingFeedback.trim(),
          { strengths: strengthsArr, improvements: improvementsArr }
        );
      }
      setGradingSuccess('Evaluation successfully recorded and published to aspirant!');
      await onRefreshAll();
      setTimeout(() => {
        setEvaluatingSubmission(null);
        setGradingSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to save evaluation.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleCruxImageSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext || '')) {
      alert('Please select an image file (PNG, JPG, SVG, or WEBP).');
      return;
    }
    setCruxImageFile(file);
    setCruxImageName(file.name);
    if (file.size < 1024 * 1024) {
      setCruxImageSize(`${Math.round(file.size / 1024)} KB`);
    } else {
      setCruxImageSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    }
    if (!cruxInfographicTitle.trim()) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setCruxInfographicTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCruxImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExistingTopicImageSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext || '')) {
      alert('Please select an image file (PNG, JPG, SVG, or WEBP).');
      return;
    }
    setExistingTopicImageFile(file);
    setExistingTopicImageName(file.name);
    if (!existingTopicImageTitle.trim()) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setExistingTopicImageTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setExistingTopicImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishCrux = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cruxTitle.trim()) return;
    setIsPublishingCrux(true);
    setCruxPublishSuccess(null);
    try {
      const bullets = cruxBullets
        .split('\n')
        .map((b) => b.replace(/^•\s*/, '').trim())
        .filter(Boolean);

      const articles = cruxArticles
        .split('\n')
        .map((line) => {
          const [label, val] = line.split(':');
          return label && val ? { label: label.trim(), value: val.trim() } : null;
        })
        .filter((item): item is { label: string; value: string } => item !== null);

      let finalImageUrl = cruxInfographicUrl.trim();
      if (cruxUploadMode === 'file' && cruxImagePreview) {
        finalImageUrl = cruxImagePreview;
      }

      const infographics: InfographicItem[] = [];
      if (finalImageUrl) {
        const infoId = `info_${Date.now()}`;
        if (cruxImageFile) {
          void storeBlob(`topic-info-${infoId}`, cruxImageFile);
        }
        infographics.push({
          id: infoId,
          title: cruxInfographicTitle.trim() || `${cruxTitle} Mindmap`,
          url: finalImageUrl,
          caption: cruxInfographicCaption.trim() || 'Editorial mindmap & key conceptual flowchart',
          source: cruxSource.trim() || 'CivilEdge Editorial Bureau',
          uploadedAt: new Date().toISOString(),
        });
      }

      const payload: NewTopicPayload = {
        title: cruxTitle.trim(),
        category: cruxCategory.trim(),
        source: cruxSource.trim(),
        publishDate: new Date().toISOString().split('T')[0],
        readTimeMinutes: cruxReadTime,
        gsPaper: cruxGsPaper,
        summaryBullets: bullets,
        keyArticlesOrData: articles,
        mindmapNodes: [
          { title: cruxTitle.slice(0, 30), color: 'amber', items: ['Constitutional Mandate', 'Article 280 Principles'] },
          { title: 'Core Devolution Matrix', color: 'blue', items: ['Vertical Share (41%)', 'Horizontal Criteria Weightage'] },
        ],
        infographics,
      };

      await repo.publishTopicOfDay(payload);
      setCruxPublishSuccess('Daily Crux article and visual infographic published successfully!');
      setCruxTitle('');
      setCruxInfographicUrl('');
      setCruxInfographicTitle('');
      setCruxInfographicCaption('Editorial mindmap & key conceptual flowchart');
      setCruxImageFile(null);
      setCruxImagePreview(null);
      setCruxImageName('');
      setCruxImageSize('');
      if (cruxFileInputRef.current) cruxFileInputRef.current.value = '';
      await onRefreshAll();
      setTimeout(() => setCruxPublishSuccess(null), 3000);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to publish Daily Crux.');
    } finally {
      setIsPublishingCrux(false);
    }
  };

  const handleAddInfographicToExistingTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForInfographic) return;
    setIsAddingInfographicToTopic(true);
    try {
      let finalUrl = existingTopicImageUrl.trim();
      if (existingTopicUploadMode === 'file' && existingTopicImagePreview) {
        finalUrl = existingTopicImagePreview;
      }
      if (!finalUrl) {
        alert('Please select an image file or provide an image URL.');
        setIsAddingInfographicToTopic(false);
        return;
      }
      const infoId = `info_${Date.now()}`;
      if (existingTopicImageFile) {
        void storeBlob(`topic-info-${infoId}`, existingTopicImageFile);
      }
      const newInfo: InfographicItem = {
        id: infoId,
        title: existingTopicImageTitle.trim() || `${topicForInfographic.title} Visual Mindmap`,
        url: finalUrl,
        caption: existingTopicImageCaption.trim() || 'Analytical breakdown and syllabus linkages',
        source: topicForInfographic.source || 'CivilEdge Editorial Bureau',
        uploadedAt: new Date().toISOString(),
      };

      const updated = [...(topicForInfographic.infographics ?? []), newInfo];
      await repo.updateTopicInfographics(topicForInfographic.id, updated);
      await onRefreshAll();
      setTopicForInfographic(null);
      setExistingTopicImageFile(null);
      setExistingTopicImagePreview(null);
      setExistingTopicImageUrl('');
      setExistingTopicImageTitle('');
      setExistingTopicImageCaption('');
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to attach infographic to topic.');
    } finally {
      setIsAddingInfographicToTopic(false);
    }
  };

  const handleImportQuizSubmit = async () => {
    if (!parseResult.valid || parseResult.questions.length === 0 || isImportingQuiz) return;
    setIsImportingQuiz(true);
    setQuizImportResult(null);
    try {
      const payload: NewQuizImportPayload = {
        title: quizTitle.trim(),
        gsPaper: quizPaper,
        subject: quizSubject.trim(),
        testType: 'topic_quiz',
        durationMinutes: quizDuration,
        isPublished: true,
        questions: parseResult.questions,
      };
      await repo.importQuiz(payload);
      setQuizImportResult({
        success: true,
        message: `Successfully imported ${parseResult.questions.length} MCQs and created test "${quizTitle}"!`,
      });
      await onRefreshAll();
    } catch (err: any) {
      setQuizImportResult({
        success: false,
        message: err instanceof Error ? err.message : 'Quiz import failed.',
      });
    } finally {
      setIsImportingQuiz(false);
    }
  };

  // Metrics
  const liveBroadcast = broadcasts.find((b) => b.status === 'live');
  const scheduledBroadcasts = broadcasts.filter((b) => b.status === 'scheduled');
  const evaluatedCount = submissions.filter((s) => s.status === 'evaluated').length;
  const pendingCount = submissions.length - evaluatedCount;
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloads || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50/30 to-slate-50 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Academy Administration &amp; Control
                  </h1>
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    Live Production
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Director: <strong className="text-slate-900 font-semibold">{profile.displayName}</strong> ({profile.email}) · UPSC CSE 2026–27 Academic Cycle
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
              <span>{refreshing ? 'Syncing…' : 'Sync Records'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenBroadcastScheduler}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-xs cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>+ Launch Seminar / Live</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadResourceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload PDF / JPG Resource</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Aspirants Enrolled
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{enrolledCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {enrolledCount === 0 ? 'Batch Ready' : `${enrolledCount} active`}
              </span>
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">CSE 2026/27 Cohort</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Daily Crux Articles
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{topics.length}</span>
              <span className="text-[10px] text-amber-700 font-medium">Published</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">With Infographics</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Live Seminars
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{broadcasts.length}</span>
              {liveBroadcast ? (
                <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  1 On Stage
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">{scheduledBroadcasts.length} scheduled</span>
              )}
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">YouTube / Meet / Zoom</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Prelims Test Sets
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{quizzes.length}</span>
              <span className="text-[10px] text-slate-600 font-mono">Bilingual</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">GS-1 / GS-2 / CSAT</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Mains DAW Copies
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{submissions.length}</span>
              {pendingCount > 0 ? (
                <span className="text-[10px] text-amber-700 font-bold">{pendingCount} pending</span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold">100% evaluated</span>
              )}
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">Rubric Graded</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Handouts &amp; Vault
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold text-slate-900">{resources.length}</span>
              <span className="text-[10px] text-slate-600">{totalDownloads} dl</span>
            </div>
            <span className="mt-1 text-[11px] text-slate-500 block">PDFs &amp; Infographics</span>
          </div>
        </div>
      </div>

      {/* Admin Module Segmented Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Executive Pulse', icon: Sparkles },
          { id: 'mains', label: `Mains Evaluation Desk (${submissions.length})`, icon: FileCheck },
          { id: 'broadcasts', label: `Broadcasts & Timetable (${broadcasts.length})`, icon: Radio },
          { id: 'crux', label: 'Daily Crux & Infographics', icon: BookOpen },
          { id: 'quiz', label: 'Prelims CSV Importer', icon: Award },
          { id: 'resources', label: `Resource Vault (${resources.length})`, icon: Layers },
          { id: 'cohort', label: 'Enrolled Aspirants & Activity', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminDashboardTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Pulse / Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Seminar Radar */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900">Faculty Classroom Broadcast Radar</h3>
                    <p className="text-xs text-slate-500">Live Stage &amp; Scheduled Timetable Operations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenBroadcastScheduler}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-xs cursor-pointer"
                >
                  + Launch New Broadcast
                </button>
              </div>

              {liveBroadcast ? (
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wider animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Live On Stage Now
                    </span>
                    <span className="font-mono text-xs text-slate-500">Source: {liveBroadcast.source.toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-slate-900">{liveBroadcast.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Faculty: <strong className="text-slate-900">{liveBroadcast.faculty}</strong> · Paper: <span className="font-semibold text-amber-700">{liveBroadcast.subject}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-rose-100 text-xs">
                    <span className="font-mono text-slate-500 truncate max-w-sm">{liveBroadcast.streamUrl}</span>
                    {onSelectBroadcast && (
                      <button
                        type="button"
                        onClick={() => onSelectBroadcast(liveBroadcast)}
                        className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        Inspect Live Classroom Stage
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2 bg-slate-50/60">
                  <Radio className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No broadcast currently live on stage</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Aspirants see the countdown schedule until you click "+ Launch Seminar" or schedule a lecture.
                  </p>
                </div>
              )}

              {/* Upcoming scheduled strip */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Next Scheduled Seminars ({scheduledBroadcasts.length})
                </h4>
                <div className="space-y-2">
                  {scheduledBroadcasts.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-xs transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{b.title}</span>
                        <span className="text-[11px] text-slate-500">
                          {b.faculty} · {b.subject} · {formatDateTimeIST(b.scheduledAt)}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono text-[11px] font-semibold text-slate-700">
                        {b.source.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Security & Production Integrity Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">Production Infrastructure</h3>
                  <p className="text-xs text-slate-500">Enterprise Security &amp; Data Health</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Role-Based Access Control (RBAC)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Admins, mentors, and aspirants isolated. Questions and tests cannot be modified by students.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">End-to-End Encryption (TLS 1.3)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All Mains evaluation copies, Prelims scores, and live chat streams transmitted securely.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Real-Time Classroom Presence</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Live doubts, upvotes, and stream viewer counts synchronized across active aspirant devices.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Automated Daily Snapshot Backups</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Student study streaks, micro-syllabus progress, and PDF resources permanently preserved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1.5 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  UPSC CSE 2026–27 Benchmark
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  CivilEdge engine is tuned to official UPSC negative marking (+2.00 correct / -0.66 incorrect) and standard 10/15/20 mark Mains evaluation rubrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mains Answer Writing Evaluation Desk */}
      {activeTab === 'mains' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Mains DAW Evaluation &amp; Grading Desk</h3>
              <p className="text-xs text-slate-500">
                Review submitted student answer copies, assign official marks, and provide constructive mentor guidance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-xs">
                Total Submissions: <strong>{submissions.length}</strong>
              </span>
              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800">
                Evaluated: <strong>{evaluatedCount}</strong>
              </span>
            </div>
          </div>

          {/* Submissions Table / Cards */}
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => {
              const q = mainsQuestions.find((mq) => mq.id === sub.questionId);
              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 transition-all hover:border-amber-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700">
                        {q?.gsPaper || 'Mains Question'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTimeIST(sub.createdAt)} · {sub.wordCount} words
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sub.status === 'evaluated'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {sub.status === 'evaluated' ? `Graded: ${sub.score} / ${sub.maxMarks}` : 'Awaiting Faculty Evaluation'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartGrading(sub)}
                        className="rounded-xl bg-amber-500 px-3.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs cursor-pointer"
                      >
                        Grade / Review Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-sm">{sub.questionPrompt}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      &ldquo;{sub.answerText}&rdquo;
                    </p>
                  </div>

                  {sub.feedback ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-slate-700 space-y-1">
                      <span className="font-semibold text-emerald-900">Faculty Feedback:</span>
                      <p className="text-[11px] leading-relaxed">{sub.feedback}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Interactive Evaluation Modal / Drawer */}
          {evaluatingSubmission && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Grade Mains Submission"
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-300">
                      <FileCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">Faculty Mains Evaluation Desk</h3>
                      <p className="text-xs text-slate-500">
                        Submitted Answer ({evaluatingSubmission.wordCount} words) · Max Marks: {evaluatingSubmission.maxMarks}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEvaluatingSubmission(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {gradingSuccess && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {gradingSuccess}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Question Prompt</span>
                  <p className="font-serif text-sm font-semibold text-slate-900 leading-relaxed">
                    {evaluatingSubmission.questionPrompt}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Aspirant's Answer Copy</span>
                  <div className="whitespace-pre-line text-xs text-slate-700 leading-relaxed max-h-56 overflow-y-auto font-sans p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {evaluatingSubmission.answerText}
                  </div>
                </div>

                <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Awarded Score (out of {evaluatingSubmission.maxMarks})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        max={evaluatingSubmission.maxMarks}
                        required
                        value={gradingScore}
                        onChange={(e) => setGradingScore(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard Scoring Band</label>
                      <div className="flex items-center gap-2 pt-1">
                        {[
                          { label: 'Fair (40%)', pct: 0.4 },
                          { label: 'Good (55%)', pct: 0.55 },
                          { label: 'Excellent (65%)', pct: 0.65 },
                        ].map((b) => (
                          <button
                            key={b.label}
                            type="button"
                            onClick={() => setGradingScore(Math.round(evaluatingSubmission.maxMarks * b.pct * 10) / 10)}
                            className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white cursor-pointer"
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Faculty Feedback &amp; Review Remarks</label>
                    <textarea
                      rows={3}
                      required
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      placeholder="Comment on structure, introduction crispness, case laws, and conclusion..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-emerald-800 mb-1">Noteworthy Strengths (one per line)</label>
                      <textarea
                        rows={3}
                        value={gradingStrengths}
                        onChange={(e) => setGradingStrengths(e.target.value)}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50/30 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-amber-800 mb-1">High-Impact Areas for Improvement</label>
                      <textarea
                        rows={3}
                        value={gradingImprovements}
                        onChange={(e) => setGradingImprovements(e.target.value)}
                        className="w-full rounded-xl border border-amber-200 bg-amber-50/30 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEvaluatingSubmission(null)}
                      className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGrading}
                      className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isGrading ? 'Publishing Evaluation…' : 'Record & Publish Evaluation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Broadcasts & Seminars Manager */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Broadcast Classes &amp; Timetable Control</h3>
              <p className="text-xs text-slate-500">
                Launch interactive seminars via YouTube Live, Google Meet, Zoom, OBS/HLS, or in-browser studio.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBroadcastScheduler}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-xs cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>+ Launch / Schedule Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'live'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : b.status === 'scheduled'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status === 'live' ? 'Live Stage' : b.status}
                    </span>
                    <span className="font-semibold text-xs text-amber-800">{b.subject}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-xs text-slate-500">{b.source.toUpperCase()}</span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-slate-900">{b.title}</h4>
                  <p className="text-xs text-slate-500">
                    Faculty: <strong className="text-slate-800 font-semibold">{b.faculty}</strong> · Scheduled: {formatDateTimeIST(b.scheduledAt)} ({b.durationMinutes} mins)
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate max-w-lg">{b.streamUrl}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSelectBroadcast && (
                    <button
                      type="button"
                      onClick={() => onSelectBroadcast(b)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer shadow-xs"
                    >
                      Inspect Stage
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Delete seminar "${b.title}"?`)) {
                        await repo.deleteBroadcast(b.id);
                        await onRefreshAll();
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete seminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Daily Crux & Infographics Publisher */}
      {activeTab === 'crux' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Daily Crux &amp; Infographics Studio</h3>
              <p className="text-xs text-slate-500">
                Publish high-yield daily editorial summaries, landmark case laws, and conceptual mindmaps.
              </p>
            </div>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-xs text-slate-700 shadow-xs">
              Published Articles: <strong>{topics.length}</strong>
            </span>
          </div>

          {cruxPublishSuccess && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {cruxPublishSuccess}
            </div>
          )}

          {/* New Article Publisher Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <h4 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              Publish Today's Crux Editorial Article
            </h4>

            <form onSubmit={handlePublishCrux} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Article Title / Core Theme</label>
                  <input
                    type="text"
                    required
                    value={cruxTitle}
                    onChange={(e) => setCruxTitle(e.target.value)}
                    placeholder="e.g. 16th Finance Commission Terms of Reference: Federal Fiscal Dynamics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GS Paper</label>
                  <select
                    value={cruxGsPaper}
                    onChange={(e) => setCruxGsPaper(e.target.value as GSBadge)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    {GS_BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={cruxCategory}
                    onChange={(e) => setCruxCategory(e.target.value)}
                    placeholder="e.g. Indian Polity &amp; Governance"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source / Attribution</label>
                  <input
                    type="text"
                    required
                    value={cruxSource}
                    onChange={(e) => setCruxSource(e.target.value)}
                    placeholder="The Hindu / Indian Express / PIB"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Read Time (mins)</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={cruxReadTime}
                    onChange={(e) => setCruxReadTime(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Summary Bullets (one per line)</label>
                <textarea
                  rows={3}
                  required
                  value={cruxBullets}
                  onChange={(e) => setCruxBullets(e.target.value)}
                  placeholder="• Point 1&#10;• Point 2&#10;• Point 3"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Key Constitutional Articles or Empirical Data (format: Label : Value)
                </label>
                <textarea
                  rows={3}
                  value={cruxArticles}
                  onChange={(e) => setCruxArticles(e.target.value)}
                  placeholder="Article 280 : Finance Commission Mandate&#10;41% : Recommended Vertical Devolution"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              {/* Infographic / Mindmap Attachment Zone */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                      Attach Infographic / Mindmap (Optional)
                    </span>
                  </div>
                  {/* Mode switcher */}
                  <div className="inline-flex rounded-xl bg-white border border-amber-200 p-0.5 text-xs font-medium shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCruxUploadMode('file')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                        cruxUploadMode === 'file'
                          ? 'bg-amber-500 font-bold text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCruxUploadMode('url')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                        cruxUploadMode === 'url'
                          ? 'bg-amber-500 font-bold text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web URL</span>
                    </button>
                  </div>
                </div>

                {cruxUploadMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={cruxFileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/jpg"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleCruxImageSelect(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                    {!cruxImagePreview ? (
                      <div
                        onClick={() => cruxFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) handleCruxImageSelect(e.dataTransfer.files[0]);
                        }}
                        className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white/70 hover:bg-white rounded-xl p-5 text-center cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-amber-950">
                          Click or drag &amp; drop infographic image from local device
                        </p>
                        <p className="text-[11px] text-slate-500">
                          PNG, JPG, SVG, or WEBP · High-resolution storage via IndexedDB
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-white p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img
                            src={cruxImagePreview}
                            alt="Preview"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{cruxImageName || 'Selected Infographic'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {cruxImageSize && (
                                <span className="rounded-md bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                                  {cruxImageSize}
                                </span>
                              )}
                              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Ready for publication
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => cruxFileInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCruxImageFile(null);
                              setCruxImagePreview(null);
                              setCruxImageName('');
                              setCruxImageSize('');
                              if (cruxFileInputRef.current) cruxFileInputRef.current.value = '';
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Web Image URL
                    </label>
                    <input
                      type="url"
                      value={cruxInfographicUrl}
                      onChange={(e) => setCruxInfographicUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or cloud image URL"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none font-mono text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Infographic Title
                    </label>
                    <input
                      type="text"
                      value={cruxInfographicTitle}
                      onChange={(e) => setCruxInfographicTitle(e.target.value)}
                      placeholder="e.g. Fiscal Federalism Flowchart 2026"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Infographic Caption / Syllabus Linkage
                    </label>
                    <input
                      type="text"
                      value={cruxInfographicCaption}
                      onChange={(e) => setCruxInfographicCaption(e.target.value)}
                      placeholder="e.g. Editorial mindmap & key conceptual flowchart"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPublishingCrux}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isPublishingCrux ? 'Publishing…' : 'Publish Article to Daily Crux'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Articles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Existing Daily Crux Publications ({topics.length})
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {topics.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-amber-800">{t.gsPaper}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{t.publishDate}</span>
                      {t.infographics && t.infographics.length > 0 && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-emerald-700" />
                          {t.infographics.length} {t.infographics.length === 1 ? 'Infographic' : 'Infographics'}
                        </span>
                      )}
                    </div>
                    <h5 className="font-serif font-bold text-slate-900 text-sm">{t.title}</h5>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTopicForInfographic(t);
                        setExistingTopicImageFile(null);
                        setExistingTopicImagePreview(null);
                        setExistingTopicImageName('');
                        setExistingTopicImageUrl('');
                        setExistingTopicImageTitle('');
                        setExistingTopicImageCaption('');
                        setExistingTopicUploadMode('file');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors"
                      title="Attach Infographic or Mindmap image from local device to this topic"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                      <span>+ Infographic</span>
                    </button>
                    {onOpenTopicBrief && (
                      <button
                        type="button"
                        onClick={() => onOpenTopicBrief(t)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Read Brief
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete topic "${t.title}"?`)) {
                          await repo.deleteTopicOfDay(t.id);
                          await onRefreshAll();
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Prelims CSV Importer */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Prelims MCQ Question Bank &amp; CSV Importer</h3>
              <p className="text-xs text-slate-500">
                Bulk upload bilingual statement-based MCQs using standardized pipe-delimited format.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCsvText(samplePipeDelimitedCsv)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              Load Sample Pipe Format
            </button>
          </div>

          {quizImportResult && (
            <div
              className={`rounded-xl border p-4 text-xs font-semibold flex items-center gap-2 ${
                quizImportResult.success
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
              }`}
            >
              {quizImportResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {quizImportResult.message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paper</label>
                  <select
                    value={quizPaper}
                    onChange={(e) => setQuizPaper(e.target.value as GSBadge)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    {GS_BADGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Pipe-Delimited MCQs ({parseResult.questions.length} parsed)
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    q_en | q_hi | a | b | c | d | correct (0-3) | exp_en | exp_hi
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  {parseResult.valid ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid syntax: {parseResult.questions.length} questions ready
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Syntax errors in {parseResult.errors.length} line(s)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleImportQuizSubmit}
                  disabled={!parseResult.valid || parseResult.questions.length === 0 || isImportingQuiz}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isImportingQuiz ? 'Importing…' : `Import ${parseResult.questions.length} MCQs & Publish`}
                </button>
              </div>
            </div>

            {/* Test Bank List */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h4 className="font-serif font-bold text-base text-slate-900">Active Test Bank ({quizzes.length})</h4>
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {quizzes.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800">{q.gsPaper}</span>
                      <span className="text-slate-500">{q.questionIds?.length || 0} MCQs</span>
                    </div>
                    <span className="font-bold text-slate-900 block leading-tight">{q.title}</span>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={async () => {
                          await repo.setQuizPublished(q.id, !q.isPublished);
                          await onRefreshAll();
                        }}
                        className={`text-[10px] font-bold ${q.isPublished ? 'text-emerald-700' : 'text-slate-500'} cursor-pointer`}
                      >
                        {q.isPublished ? '● Published' : '○ Draft'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete test "${q.title}"?`)) {
                            await repo.deleteQuiz(q.id);
                            await onRefreshAll();
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Resource Vault */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Academic Resource Vault &amp; Moderation</h3>
              <p className="text-xs text-slate-500">
                Manage syllabus handouts, PDF notes, and infographic cheat sheets available to aspirants.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUploadResourceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload New PDF / JPG</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-800">{item.gsPaper}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono uppercase font-bold text-slate-700">
                      {item.format}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.summary}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">{item.downloads} downloads</span>
                  <div className="flex items-center gap-2">
                    {onOpenResourceDoc && (
                      <button
                        type="button"
                        onClick={() => onOpenResourceDoc(item)}
                        className="font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete resource "${item.title}"?`)) {
                          await repo.deleteResource(item.id);
                          await onRefreshAll();
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Enrolled Aspirants & Activity */}
      {activeTab === 'cohort' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Enrolled Aspirant Cohort</h3>
              <p className="text-xs text-slate-500">
                Aspirants enrolled in CivilEdge UPSC CSE 2026–27 program with live study metrics.
              </p>
            </div>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-xs text-slate-700 shadow-xs">
              {enrolledCount} {enrolledCount === 1 ? 'Aspirant' : 'Aspirants'} Enrolled
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {displayCohortRows.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-bold text-slate-900">No Aspirants Enrolled Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your academic portal is ready for the UPSC CSE 2026–27 cycle. As candidates register and log study hours, their profiles, target years, optional subjects, and study streaks will populate this roster in real time.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Aspirant / Candidate</th>
                    <th className="p-3.5">Target Year</th>
                    <th className="p-3.5">Optional Subject</th>
                    <th className="p-3.5">Streak</th>
                    <th className="p-3.5">Hours Today</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayCohortRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-medium text-slate-900">
                        <div>
                          <span>{row.name}</span>
                          <span className="block text-[11px] text-slate-500 font-mono">{row.email}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">CSE {row.year}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{row.opt}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          {row.streak}d
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{Math.floor(row.mins / 60)}h {row.mins % 60}m</td>
                      <td className="p-3.5">
                        <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal: Attach Infographic to Existing Daily Crux Topic */}
      {topicForInfographic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                    {topicForInfographic.gsPaper}
                  </span>
                  <span className="text-xs text-slate-400">Daily Crux Mindmap</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Attach Infographic / Mindmap
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  Article: {topicForInfographic.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTopicForInfographic(null);
                  setExistingTopicImageFile(null);
                  setExistingTopicImagePreview(null);
                  setExistingTopicImageUrl('');
                }}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInfographicToExistingTopic} className="space-y-4">
              {/* Toggle upload mode */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setExistingTopicUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    existingTopicUploadMode === 'file'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Local Storage File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExistingTopicUploadMode('url')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    existingTopicUploadMode === 'url'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web Image URL</span>
                </button>
              </div>

              {/* File upload mode */}
              {existingTopicUploadMode === 'file' ? (
                <div>
                  <input
                    type="file"
                    ref={existingTopicFileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/jpg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleExistingTopicImageSelect(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  {!existingTopicImagePreview ? (
                    <div
                      onClick={() => existingTopicFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleExistingTopicImageSelect(e.dataTransfer.files[0]);
                      }}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/70 rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-amber-950">
                        Click or drag &amp; drop infographic image
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports PNG, JPG, SVG, and WEBP. Stored in high resolution.
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={existingTopicImagePreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {existingTopicImageName || 'Selected Infographic'}
                          </p>
                          <p className="text-[11px] text-emerald-600 font-medium">Ready to attach</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => existingTopicFileInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExistingTopicImageFile(null);
                              setExistingTopicImagePreview(null);
                              setExistingTopicImageName('');
                              if (existingTopicFileInputRef.current) existingTopicFileInputRef.current.value = '';
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image URL (Web or CDN link)
                  </label>
                  <input
                    type="url"
                    value={existingTopicImageUrl}
                    onChange={(e) => setExistingTopicImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Infographic Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Infographic Title
                </label>
                <input
                  type="text"
                  value={existingTopicImageTitle}
                  onChange={(e) => setExistingTopicImageTitle(e.target.value)}
                  placeholder="e.g. Fiscal Federalism Flowchart 2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Infographic Caption */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanatory Note / Caption
                </label>
                <input
                  type="text"
                  value={existingTopicImageCaption}
                  onChange={(e) => setExistingTopicImageCaption(e.target.value)}
                  placeholder="Analytical breakdown and key syllabus linkages"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTopicForInfographic(null);
                    setExistingTopicImageFile(null);
                    setExistingTopicImagePreview(null);
                    setExistingTopicImageUrl('');
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingInfographicToTopic || (existingTopicUploadMode === 'file' ? !existingTopicImagePreview : !existingTopicImageUrl.trim())}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isAddingInfographicToTopic ? 'Attaching…' : 'Attach Infographic'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Resource Modal for Admin */}
      <UploadResourceModal
        open={uploadResourceOpen}
        onClose={() => setUploadResourceOpen(false)}
        onUpload={async (payload) => {
          await repo.uploadResource(profile.uid, true, payload);
          await onRefreshAll();
        }}
      />
    </div>
  );
}
