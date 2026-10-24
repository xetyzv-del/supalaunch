import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  MessageSquare,
  Pause,
  Play,
  Radio,
  Send,
  Sparkles,
  ThumbsUp,
  Trash2,
  Tv,
  Users,
  Video,
  Youtube,
  Zap,
} from 'lucide-react';
import type { DataRepo } from '../lib/db/repo';
import { formatClock, formatScheduleIST, timeAgo, triggerBlobDownload } from '../lib/format';
import type { BroadcastClass, LectureDoubt, LectureNote, UserProfileData } from '../types';
import { Avatar } from './Avatar';

interface ClassroomPlayerProps {
  broadcast: BroadcastClass | null;
  allBroadcasts: BroadcastClass[];
  onSelectBroadcast: (b: BroadcastClass) => void;
  repo: DataRepo;
  profile: UserProfileData;
  isStaff: boolean;
  onEditBroadcast: (b: BroadcastClass) => void;
  onDeleteBroadcast: (id: string) => Promise<void>;
  onLogStudyMinutes: (mins: number) => Promise<void>;
  onOpenBroadcastStudio?: () => void;
}

function extractYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url;
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}?rel=0` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function extractVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('vimeo.com')) {
      const match = u.pathname.match(/\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function ClassroomPlayer({
  broadcast,
  allBroadcasts,
  onSelectBroadcast,
  repo,
  profile,
  isStaff,
  onEditBroadcast,
  onDeleteBroadcast,
  onLogStudyMinutes,
  onOpenBroadcastStudio,
}: ClassroomPlayerProps) {
  const [panelTab, setPanelTab] = useState<'doubts' | 'notes'>('doubts');
  const [doubts, setDoubts] = useState<LectureDoubt[]>([]);
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [doubtInput, setDoubtInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(broadcast?.viewersCount ?? 1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [deckPlaying, setDeckPlaying] = useState(broadcast?.status === 'live');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loggedNotice, setLoggedNotice] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const broadcastId = broadcast?.id;

  const loadDoubtsAndNotes = useCallback(async () => {
    if (!broadcastId) {
      setDoubts([]);
      setNotes([]);
      return;
    }
    try {
      const [dList, nList] = await Promise.all([
        repo.listDoubts(broadcastId, profile.uid),
        repo.listNotes(broadcastId, profile.uid),
      ]);
      setDoubts(dList);
      setNotes(nList);
    } catch (err) {
      console.warn('[ClassroomPlayer] Failed loading doubts/notes:', err);
    }
  }, [broadcastId, profile.uid, repo]);

  useEffect(() => {
    if (!broadcast) return;
    setSlideIndex(0);
    setElapsedSeconds(0);
    setDeckPlaying(broadcast.status === 'live');
    setConfirmDelete(false);
    void loadDoubtsAndNotes();

    const unsubDoubts = repo.subscribeDoubts(broadcast.id, () => {
      void loadDoubtsAndNotes();
    });
    const unsubPresence = repo.joinClassroomPresence(broadcast.id, profile.uid, (count) => {
      setViewerCount(count);
    });

    return () => {
      unsubDoubts();
      unsubPresence();
    };
  }, [broadcast?.id, broadcast?.status, loadDoubtsAndNotes, profile.uid, repo]);

  useEffect(() => {
    if (!deckPlaying) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deckPlaying]);

  const slides = useMemo(() => {
    if (!broadcast) return [];
    const baseTopics =
      broadcast.topicsCovered.length > 0
        ? broadcast.topicsCovered
        : ['Constitutional & Statutory Framework', 'Analytical Dimensions', 'PYQ Linkage & Way Forward'];
    return baseTopics.map((topicTitle, idx) => ({
      index: idx + 1,
      total: baseTopics.length,
      heading: topicTitle,
      synopsis:
        broadcast.description ||
        `Detailed UPSC ${broadcast.subject} faculty seminar led by ${broadcast.faculty}. Focus on conceptual clarity, statutory citations, and Mains answer structuring.`,
    }));
  }, [broadcast]);

  if (!broadcast) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-amber-50/20 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clean Slate · Zero Clutter Mock Data</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Live Stage &amp; Faculty Broadcast Studio
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Welcome Admin <strong>{profile.displayName}</strong>. You have a clean slate to broadcast live lectures or schedule upcoming seminars across any platform.
            </p>
          </div>

          {isStaff ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenBroadcastStudio}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 text-sm shadow-md transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>+ Go Live / Broadcast New Class</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Faculty lectures will stream here when scheduled or broadcasting live.
            </p>
          )}

          {/* Supported Broadcasting Sources Showcase */}
          <div className="pt-6 border-t border-slate-200/80 max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3 text-center">
              Supported Broadcasting Platforms
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <Youtube className="w-4 h-4" />
                  YouTube Live
                </div>
                <p className="text-[11px] text-slate-500">Embed or stream live to thousands</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <Video className="w-4 h-4" />
                  Google Meet
                </div>
                <p className="text-[11px] text-slate-500">1-click faculty room discussion</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                  <Tv className="w-4 h-4" />
                  Zoom Webinar
                </div>
                <p className="text-[11px] text-slate-500">Meeting ID &amp; passcode protection</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Radio className="w-4 h-4" />
                  OBS / HLS
                </div>
                <p className="text-[11px] text-slate-500">Studio RTMP / .m3u8 live feed</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Camera className="w-4 h-4" />
                  Browser WebRTC
                </div>
                <p className="text-[11px] text-slate-500">Webcam, mic &amp; screen sharing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTimestamp = () => {
    if (videoRef.current && !Number.isNaN(videoRef.current.currentTime)) {
      return Math.floor(videoRef.current.currentTime);
    }
    return elapsedSeconds;
  };

  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;
    const created = await repo.postDoubt(
      broadcast.id,
      { id: profile.uid, name: profile.displayName },
      doubtInput
    );
    setDoubts((prev) => [created, ...prev]);
    setDoubtInput('');
  };

  const handleToggleUpvote = async (doubtId: string) => {
    const res = await repo.toggleDoubtUpvote(doubtId, profile.uid);
    setDoubts((prev) =>
      prev.map((d) =>
        d.id === doubtId ? { ...d, upvotes: res.upvotes, userUpvoted: res.upvoted } : d
      )
    );
  };

  const handleSaveReply = async (doubtId: string) => {
    const reply = replyDrafts[doubtId] ?? '';
    const updated = await repo.answerDoubt(doubtId, reply);
    setDoubts((prev) => prev.map((d) => (d.id === doubtId ? { ...updated, userUpvoted: d.userUpvoted } : d)));
    setReplyOpenId(null);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const created = await repo.addNote(broadcast.id, profile.uid, currentTimestamp(), noteInput);
    setNotes((prev) => [...prev, created].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
    setNoteInput('');
  };

  const handleExportNotes = () => {
    const md = [
      `# Lecture Notes: ${broadcast.title}`,
      `**Faculty:** ${broadcast.faculty} · **Paper:** ${broadcast.subject}`,
      `**Scheduled:** ${formatScheduleIST(broadcast.scheduledAt)}`,
      ``,
      `---`,
      ``,
      ...(notes.length > 0
        ? notes.map((n) => `- **[${n.formattedTime}]** ${n.text}`)
        : ['- No timestamped notes recorded yet.']),
    ].join('\n');
    const slug = broadcast.title.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 42);
    triggerBlobDownload(`${slug}_Notes.md`, md);
  };

  const ytEmbed = broadcast.source === 'youtube' ? extractYouTubeEmbed(broadcast.streamUrl) : null;
  const vimeoEmbed = broadcast.source === 'vimeo' ? extractVimeoEmbed(broadcast.streamUrl) : null;
  const currentSlide = slides[Math.min(slideIndex, slides.length - 1)];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl">
          {allBroadcasts.map((item) => {
            const selected = item.id === broadcast.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectBroadcast(item)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  selected
                    ? 'border-amber-400 bg-amber-50 text-amber-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.status === 'live' ? '● LIVE · ' : ''}
                {item.subject} — {item.title}
              </button>
            );
          })}
        </div>

        {isStaff && onOpenBroadcastStudio ? (
          <button
            type="button"
            onClick={onOpenBroadcastStudio}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>+ Broadcast / Go Live</span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {ytEmbed || vimeoEmbed ? (
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  title={broadcast.title}
                  src={ytEmbed ?? vimeoEmbed ?? ''}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : broadcast.source === 'hls' ? (
              <div className="aspect-video w-full bg-slate-950">
                <video
                  ref={videoRef}
                  src={broadcast.streamUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            ) : broadcast.source === 'meet' || broadcast.source === 'zoom' ? (
              <div className="aspect-video w-full p-6 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="uppercase tracking-wider font-semibold text-amber-300 flex items-center gap-1.5">
                    {broadcast.source === 'zoom' ? <Tv className="w-4 h-4 text-sky-400" /> : <Video className="w-4 h-4 text-blue-400" />}
                    {broadcast.source === 'zoom' ? 'Zoom Interactive Webinar' : 'Google Meet Faculty Room'}
                  </span>
                  <span className="font-mono tabular-nums">{formatScheduleIST(broadcast.scheduledAt)}</span>
                </div>

                <div className="space-y-3 max-w-xl">
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                    {broadcast.title}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {broadcast.description ||
                      'Interactive two-way Mains mentorship and answer copy discussion room.'}
                  </p>
                  {broadcast.meetingId ? (
                    <p className="font-mono text-xs text-amber-300 pt-1">
                      Meeting ID: {broadcast.meetingId}
                      {broadcast.meetingPassword ? ` · Passcode: ${broadcast.meetingPassword}` : ''}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={broadcast.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Join Live Room Now
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      const details = `${broadcast.streamUrl}${
                        broadcast.meetingId ? ` (ID: ${broadcast.meetingId} / Passcode: ${broadcast.meetingPassword ?? 'N/A'})` : ''
                      }`;
                      try {
                        await navigator.clipboard.writeText(details);
                        setCopiedCreds(true);
                        window.setTimeout(() => setCopiedCreds(false), 1800);
                      } catch {
                        // ignore
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedCreds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCreds ? 'Room Details Copied' : 'Copy Room Link & Credentials'}
                  </button>
                  <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
                    {broadcast.streamUrl}
                  </span>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <span className="font-semibold text-amber-300">{broadcast.subject}</span>
                    <span className="text-slate-500">·</span>
                    <span>CivilEdge Studio Seminar Deck</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-slate-300 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      {viewerCount} attending
                    </span>
                    <span>·</span>
                    <span>{formatClock(elapsedSeconds)}</span>
                  </div>
                </div>

                <div className="my-auto py-4 space-y-3 max-w-2xl">
                  <p className="font-mono text-xs uppercase tracking-wider text-amber-400/90 tabular-nums">
                    Board Module {currentSlide.index} of {currentSlide.total}
                  </p>
                  <h2 className="font-serif text-xl sm:text-3xl font-semibold text-white leading-snug">
                    {currentSlide.heading}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {currentSlide.synopsis}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeckPlaying((p) => !p)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      {deckPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {deckPlaying ? 'Pause Clock' : 'Resume Clock'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onLogStudyMinutes(15);
                        setLoggedNotice(true);
                        window.setTimeout(() => setLoggedNotice(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {loggedNotice ? '+15m Logged to Streak' : 'Log +15m Attendance'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={slideIndex === 0}
                      onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                      aria-label="Previous module"
                      className="rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={slideIndex >= slides.length - 1}
                      onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                      aria-label="Next module"
                      className="rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 sm:p-6 space-y-4 border-t border-slate-100 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-amber-700 font-semibold">
                    {broadcast.subject} · {broadcast.status.toUpperCase()} · {formatScheduleIST(broadcast.scheduledAt)} ·{' '}
                    <span className="tabular-nums">{broadcast.durationMinutes} mins</span>
                  </p>
                  <h1 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
                    {broadcast.title}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Faculty: <span className="text-slate-800 font-medium">{broadcast.faculty}</span>
                    {broadcast.facultyDesignation ? ` (${broadcast.facultyDesignation})` : ''}
                  </p>
                </div>

                {isStaff ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditBroadcast(broadcast)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      Edit Seminar
                    </button>
                    {confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => onDeleteBroadcast(broadcast.id)}
                        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        aria-label="Delete seminar"
                        className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-rose-600 shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {broadcast.description ? (
                <p className="text-sm text-slate-600 leading-relaxed">{broadcast.description}</p>
              ) : null}

              {broadcast.topicsCovered.length > 0 ? (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Syllabus Anchors: </span>
                    {broadcast.topicsCovered.join(' · ')}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-white flex flex-col h-[600px] shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 p-1.5 gap-1 bg-slate-100/70">
            <button
              type="button"
              onClick={() => setPanelTab('doubts')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                panelTab === 'doubts'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Doubts ({doubts.length})
            </button>
            <button
              type="button"
              onClick={() => setPanelTab('notes')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                panelTab === 'notes'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              My Notes ({notes.length})
            </button>
          </div>

          {panelTab === 'doubts' ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {doubts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    No academic doubts raised yet. Post a conceptual question for faculty resolution.
                  </p>
                ) : (
                  doubts.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={d.user} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{d.user}</p>
                            <p className="text-[11px] text-slate-400">{timeAgo(d.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleUpvote(d.id)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                              d.userUpvoted
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {d.upvotes}
                          </button>
                          {(isStaff || d.userId === profile.uid) ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await repo.deleteDoubt(d.id);
                                setDoubts((prev) => prev.filter((x) => x.id !== d.id));
                              }}
                              aria-label="Delete doubt"
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{d.query}</p>

                      {d.facultyReply ? (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 space-y-1">
                          <p className="text-[11px] font-semibold text-emerald-800">Faculty Resolution</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{d.facultyReply}</p>
                        </div>
                      ) : null}

                      {isStaff ? (
                        replyOpenId === d.id ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              rows={2}
                              value={replyDrafts[d.id] ?? d.facultyReply ?? ''}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                              }
                              placeholder="Write concise faculty explanation..."
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyOpenId(null)}
                                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveReply(d.id)}
                                className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
                              >
                                Publish Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyDrafts((prev) => ({ ...prev, [d.id]: d.facultyReply ?? '' }));
                              setReplyOpenId(d.id);
                            }}
                            className="text-[11px] font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            {d.facultyReply ? 'Edit Faculty Reply' : 'Respond as Faculty'}
                          </button>
                        )
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {broadcast.chatEnabled !== false ? (
                <form onSubmit={handlePostDoubt} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
                  <input
                    type="text"
                    value={doubtInput}
                    onChange={(e) => setDoubtInput(e.target.value)}
                    placeholder="Ask a syllabus-linked doubt..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Submit doubt"
                    className="rounded-xl bg-amber-500 px-3 py-2 text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Jot key articles, data points, or case laws below — automatically stamped at{' '}
                    <span className="font-mono text-amber-800 font-semibold">{formatClock(currentTimestamp())}</span>.
                  </p>
                ) : (
                  notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-3 flex items-start justify-between gap-2.5 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="font-mono text-[11px] font-semibold text-amber-700 tabular-nums">
                          {n.formattedTime}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed break-words">{n.text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await repo.deleteNote(n.id);
                          setNotes((prev) => prev.filter((x) => x.id !== n.id));
                        }}
                        aria-label="Delete note"
                        className="p-1 text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-slate-200 space-y-2 bg-white">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={`Add note @ ${formatClock(currentTimestamp())}...`}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                </form>
                {notes.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleExportNotes}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    Export Lecture Notes (.md)
                  </button>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
