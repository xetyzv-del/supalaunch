import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Calendar, Layers, Radio, Shield } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminStudioModal, type AdminTab } from './components/AdminStudioModal';
import { AuthScreen } from './components/AuthScreen';
import { BroadcastSchedulerModal } from './components/BroadcastSchedulerModal';
import { ClassDetailsEditorModal } from './components/ClassDetailsEditorModal';
import { ClassroomPlayer } from './components/ClassroomPlayer';
import { DocumentReaderModal } from './components/DocumentReaderModal';
import { Header, type WorkspaceTab } from './components/Header';
import { HeroDailySection } from './components/HeroDailySection';
import { MainsWritingLab } from './components/MainsWritingLab';
import { QuizEngine } from './components/QuizEngine';
import { QuizHub } from './components/QuizHub';
import { ResourceLibrary } from './components/ResourceLibrary';
import { StudentPortalDrawer } from './components/StudentPortalDrawer';
import { SyllabusTracker } from './components/SyllabusTracker';
import { TimetableSection } from './components/TimetableSection';
import { useAuth } from './hooks/useAuth';
import { getRepo } from './lib/db';
import { isSupabaseConfigured } from './lib/supabase';
import type { DocumentOpenPayload } from './lib/db/repo';
import type {
  BroadcastClass,
  MainsQuestion,
  MainsSubmissionRecord,
  Quiz,
  QuizQuestion,
  ResourceItem,
  SyllabusPaper,
  TestAttemptRecord,
  TopicOfDay,
  UserProfileData,
} from './types';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error('Supabase request timed out. Check the project URL, DNS, and network connection, then retry.')),
      timeoutMs
    );
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export function App() {
  const auth = useAuth();
  const repo = getRepo();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('crux');
  const [classroomMode, setClassroomMode] = useState<'stage' | 'schedule'>('stage');
  const [studyHubMode, setStudyHubMode] = useState<'library' | 'syllabus'>('library');

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [topics, setTopics] = useState<TopicOfDay[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastClass[]>([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string>('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<TestAttemptRecord[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ quiz: Quiz; questions: QuizQuestion[] } | null>(null);
  const [mainsQuestions, setMainsQuestions] = useState<MainsQuestion[]>([]);
  const [submissions, setSubmissions] = useState<MainsSubmissionRecord[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [syllabus, setSyllabus] = useState<SyllabusPaper[]>([]);

  const [hydrating, setHydrating] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [portalOpen, setPortalOpen] = useState(false);
  const [adminStudioOpen, setAdminStudioOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('quiz');
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<BroadcastClass | null>(null);
  const [readerDoc, setReaderDoc] = useState<DocumentOpenPayload | null>(null);

  const isStaff = profile?.role === 'admin' || profile?.role === 'mentor';

  const hydrateWorkspace = useCallback(async () => {
    if (!auth.user) return;
    setLoadError(null);
    try {
      const prof = await withTimeout(repo.getProfile({
        id: auth.user.id,
        email: auth.user.email,
        displayName: auth.user.displayName,
        photoURL: auth.user.photoURL,
      }));
      setProfile(prof);
      const staff = prof.role === 'admin' || prof.role === 'mentor';

      const [tList, bList, qList, aList, mqList, subList, rList, sylList] = await withTimeout(Promise.all([
        repo.listTopicsOfDay(),
        repo.listBroadcasts(),
        repo.listQuizzes(staff),
        repo.listAttempts(prof.uid),
        repo.listMainsQuestions(),
        repo.listSubmissions(prof.uid),
        repo.listResources(prof.uid, staff),
        repo.loadSyllabus(prof.uid),
      ]));

      setTopics(tList);
      setBroadcasts(bList);
      setSelectedBroadcastId((prev) =>
        bList.some((b) => b.id === prev) ? prev : (bList[0]?.id ?? '')
      );
      setQuizzes(qList);
      setAttempts(aList);
      setMainsQuestions(mqList);
      setSubmissions(subList);
      setResources(rList);
      setSyllabus(sylList);
    } catch (err) {
      setProfile(null);
      setLoadError(err instanceof Error ? err.message : 'Unable to load workspace data.');
    } finally {
      setHydrating(false);
    }
  }, [auth.user, repo]);

  useEffect(() => {
    if (!auth.user) {
      setHydrating(false);
      return;
    }
    setHydrating(true);
    void hydrateWorkspace();
  }, [auth.user, hydrateWorkspace]);

  useEffect(() => {
    if (!auth.user || !profile) return;
    const unsubB = repo.subscribeBroadcasts(() => {
      void repo.listBroadcasts().then(setBroadcasts).catch(() => {});
    });
    const unsubR = repo.subscribeResources(() => {
      void repo.listResources(profile.uid, isStaff).then(setResources).catch(() => {});
    });
    return () => {
      unsubB();
      unsubR();
    };
  }, [auth.user, isStaff, profile, repo]);

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-700 flex items-center justify-center text-sm font-medium">
        Initializing CivilEdge IAS Workspace…
      </div>
    );
  }

  if (!auth.user) {
    return (
      <AuthScreen
        onSignIn={auth.signInWithPassword}
        onSignUp={auth.signUpWithPassword}
        onMagicLink={auth.sendMagicLink}
        onGoogleSignIn={auth.signInWithGoogle}
        onPasswordReset={auth.sendPasswordReset}
        isSupabaseConfigured={isSupabaseConfigured}
      />
    );
  }

  if (hydrating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-700 flex items-center justify-center text-sm font-medium">
        Loading UPSC CSE Study Workspace…
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f4f5f2] px-5 py-12 text-slate-900 sm:px-8">
        <section role="alert" className="mx-auto mt-12 max-w-xl border-l-4 border-rose-600 bg-white px-6 py-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Workspace unavailable</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">We couldn’t connect your account</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {loadError || 'Your profile could not be loaded from Supabase. Check the project URL and database schema, then retry.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setHydrating(true);
                void hydrateWorkspace();
              }}
              className="rounded-md bg-[#173f39] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#21584f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Retry connection
            </button>
            <button
              type="button"
              onClick={() => void auth.signOut()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  const liveClass = broadcasts.find((b) => b.status === 'live') ?? null;
  const activeBroadcast =
    broadcasts.find((b) => b.id === selectedBroadcastId) ?? broadcasts[0] ?? null;

  const handleStartQuiz = async (quiz: Quiz) => {
    const qs = await repo.getQuizQuestions(quiz.id);
    setActiveQuiz({ quiz, questions: qs });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20 text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={(next) => {
          setActiveTab(next);
          if (next !== 'prelims') setActiveQuiz(null);
        }}
        onOpenPortal={() => setPortalOpen(true)}
        userDisplayName={profile.displayName}
        isStaff={isStaff}
      />

      {/* Contextual Workspace Sub-Toolbar */}
      <div className="border-b border-slate-200/90 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-300 px-3 py-0.5 text-xs font-bold text-amber-900">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              CivilEdge IAS · UPSC CSE 2026–27
            </span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="hidden sm:inline font-mono tabular-nums text-slate-600">
              CSE {profile.targetYear} · {profile.streakDays}d Streak · {profile.studyMinutes}/{profile.targetMinutes}m today
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'classroom' ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setClassroomMode('stage')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                      classroomMode === 'stage'
                        ? 'bg-white text-amber-800 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Radio className="w-3 h-3 text-amber-600" />
                    Live Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomMode('schedule')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                      classroomMode === 'schedule'
                        ? 'bg-white text-amber-800 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-amber-600" />
                    Timetable
                  </button>
                </div>

                {isStaff ? (
                  <button
                    type="button"
                    onClick={() => setSchedulerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>+ Go Live / Broadcast</span>
                  </button>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'hub' ? (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setStudyHubMode('library')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                    studyHubMode === 'library'
                      ? 'bg-white text-amber-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  Academic Library
                </button>
                <button
                  type="button"
                  onClick={() => setStudyHubMode('syllabus')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                    studyHubMode === 'syllabus'
                      ? 'bg-white text-amber-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3 text-amber-600" />
                  Micro-Syllabus
                </button>
              </div>
            ) : null}

            {isStaff ? (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-bold text-xs shadow-xs cursor-pointer transition-all ${
                  activeTab === 'admin'
                    ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:text-amber-800 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Dashboard</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loadError ? (
          <div className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 flex items-center justify-between gap-4 text-xs text-rose-800">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void hydrateWorkspace()}
              className="rounded-lg bg-rose-100 px-3 py-1.5 font-semibold text-rose-900 hover:bg-rose-200 cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        ) : null}

        {activeTab === 'crux' ? (
          <HeroDailySection
            topics={topics}
            liveClass={liveClass}
            isStaff={isStaff}
            onOpenBrief={async (t) => {
              const doc = await repo.openTopicBrief(t);
              setReaderDoc(doc);
            }}
            onDeleteTopic={async (id) => {
              await repo.deleteTopicOfDay(id);
              setTopics(await repo.listTopicsOfDay());
            }}
            onUpdateInfographics={async (topicId, infographics) => {
              await repo.updateTopicInfographics(topicId, infographics);
              setTopics(await repo.listTopicsOfDay());
            }}
            onJumpClassroom={() => {
              if (liveClass) setSelectedBroadcastId(liveClass.id);
              setClassroomMode('stage');
              setActiveTab('classroom');
            }}
            onJumpPrelims={() => setActiveTab('prelims')}
            onJumpMains={() => setActiveTab('mains')}
          />
        ) : null}

        {activeTab === 'classroom' ? (
          classroomMode === 'stage' ? (
            <ClassroomPlayer
              broadcast={activeBroadcast}
              allBroadcasts={broadcasts}
              onSelectBroadcast={(b) => setSelectedBroadcastId(b.id)}
              repo={repo}
              profile={profile}
              isStaff={isStaff}
              onOpenBroadcastStudio={() => setSchedulerOpen(true)}
              onEditBroadcast={(b) => setEditingBroadcast(b)}
              onDeleteBroadcast={async (id) => {
                await repo.deleteBroadcast(id);
                const next = await repo.listBroadcasts();
                setBroadcasts(next);
                setSelectedBroadcastId(next[0]?.id ?? '');
              }}
              onLogStudyMinutes={async (mins) => {
                const updated = await repo.logStudyMinutes(profile.uid, mins);
                setProfile(updated);
              }}
            />
          ) : (
            <TimetableSection
              broadcasts={broadcasts}
              isStaff={isStaff}
              onSelectClass={(b) => {
                setSelectedBroadcastId(b.id);
                setClassroomMode('stage');
              }}
              onOpenScheduler={() => setSchedulerOpen(true)}
            />
          )
        ) : null}

        {activeTab === 'prelims' ? (
          activeQuiz ? (
            <QuizEngine
              quiz={activeQuiz.quiz}
              questions={activeQuiz.questions}
              onSaveAttempt={async (payload) => {
                const rec = await repo.saveAttempt(profile.uid, payload);
                setAttempts(await repo.listAttempts(profile.uid));
                const mins = Math.max(5, Math.round(payload.timeTakenSeconds / 60));
                const updatedProf = await repo.logStudyMinutes(profile.uid, mins);
                setProfile(updatedProf);
                return rec;
              }}
              onExit={() => setActiveQuiz(null)}
            />
          ) : (
            <QuizHub
              quizzes={quizzes}
              attempts={attempts}
              isStaff={isStaff}
              onStartQuiz={handleStartQuiz}
              onTogglePublish={async (quizId: string, nextPublished: boolean) => {
                await repo.setQuizPublished(quizId, nextPublished);
                setQuizzes(await repo.listQuizzes(isStaff));
              }}
              onDeleteQuiz={async (quizId: string) => {
                await repo.deleteQuiz(quizId);
                setQuizzes(await repo.listQuizzes(isStaff));
              }}
              onOpenAdminImport={() => {
                setAdminInitialTab('quiz');
                setAdminStudioOpen(true);
              }}
            />
          )
        ) : null}

        {activeTab === 'mains' ? (
          <MainsWritingLab
            questions={mainsQuestions}
            submissions={submissions}
            isStaff={isStaff}
            onEvaluate={async (question: MainsQuestion, answerText: string) => {
              const sub = await repo.submitAndEvaluateMains(profile.uid, question, answerText);
              setSubmissions(await repo.listSubmissions(profile.uid));
              const updatedProf = await repo.logStudyMinutes(profile.uid, 15);
              setProfile(updatedProf);
              return sub;
            }}
            onDeleteQuestion={async (id: string) => {
              await repo.deleteMainsQuestion(id);
              setMainsQuestions(await repo.listMainsQuestions());
            }}
          />
        ) : null}

        {activeTab === 'hub' ? (
          studyHubMode === 'library' ? (
            <ResourceLibrary
              resources={resources}
              isStaff={isStaff}
              onOpenResource={async (item: ResourceItem) => {
                const { doc, downloads } = await repo.openResource(item);
                setResources((prev) =>
                  prev.map((r) => (r.id === item.id ? { ...r, downloads } : r))
                );
                setReaderDoc(doc);
              }}
              onUploadResource={async (payload: any) => {
                await repo.uploadResource(profile.uid, isStaff, payload);
                setResources(await repo.listResources(profile.uid, isStaff));
              }}
              onModerateResource={async (id: string, status: any) => {
                await repo.setResourceModeration(id, status);
                setResources(await repo.listResources(profile.uid, isStaff));
              }}
              onDeleteResource={async (id: string) => {
                await repo.deleteResource(id);
                setResources(await repo.listResources(profile.uid, isStaff));
              }}
            />
          ) : (
            <SyllabusTracker
              papers={syllabus}
              onToggleSubtopic={async (subtopicId: string, completed: boolean) => {
                setSyllabus((prev) =>
                  prev.map((p) => ({
                    ...p,
                    subtopics: p.subtopics.map((s) =>
                      s.id === subtopicId ? { ...s, completed } : s
                    ),
                  }))
                );
                await repo.setSubtopicCompleted(profile.uid, subtopicId, completed);
              }}
            />
          )
        ) : null}

        {activeTab === 'admin' && isStaff ? (
          <AdminDashboard
            repo={repo}
            profile={profile}
            topics={topics}
            broadcasts={broadcasts}
            quizzes={quizzes}
            mainsQuestions={mainsQuestions}
            submissions={submissions}
            resources={resources}
            onOpenBroadcastScheduler={() => setSchedulerOpen(true)}
            onRefreshAll={hydrateWorkspace}
            onSelectBroadcast={(b) => {
              setSelectedBroadcastId(b.id);
              setClassroomMode('stage');
              setActiveTab('classroom');
            }}
            onOpenResourceDoc={async (item) => {
              const { doc, downloads } = await repo.openResource(item);
              setResources((prev) =>
                prev.map((r) => (r.id === item.id ? { ...r, downloads } : r))
              );
              setReaderDoc(doc);
            }}
            onOpenTopicBrief={async (t) => {
              const doc = await repo.openTopicBrief(t);
              setReaderDoc(doc);
            }}
          />
        ) : null}
      </main>

      {/* Modals & Drawers */}
      <StudentPortalDrawer
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        profile={profile}
        onUpdateProfile={async (patch) => {
          const updated = await repo.updateProfile(profile.uid, patch);
          setProfile(updated);
        }}
        onLogMinutes={async (mins) => {
          const updated = await repo.logStudyMinutes(profile.uid, mins);
          setProfile(updated);
        }}
        onOpenAdminStudio={() => {
          setActiveTab('admin');
        }}
        onSignOut={auth.signOut}
      />

      <AdminStudioModal
        open={adminStudioOpen}
        initialTab={adminInitialTab}
        onClose={() => setAdminStudioOpen(false)}
        repo={repo}
        currentRole={profile.role}
        resources={resources}
        onRefreshAll={hydrateWorkspace}
      />

      <BroadcastSchedulerModal
        open={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        defaultFacultyName={profile.displayName}
        onCreate={async (payload) => {
          const created = await repo.createBroadcast(payload);
          const list = await repo.listBroadcasts();
          setBroadcasts(list);
          setSelectedBroadcastId(created.id);
          setClassroomMode('stage');
          setActiveTab('classroom');
        }}
      />

      <ClassDetailsEditorModal
        broadcast={editingBroadcast}
        onClose={() => setEditingBroadcast(null)}
        onSave={async (id, patch) => {
          await repo.updateBroadcast(id, patch);
          setBroadcasts(await repo.listBroadcasts());
        }}
      />

      <DocumentReaderModal doc={readerDoc} onClose={() => setReaderDoc(null)} />
    </div>
  );
}

export default App;
