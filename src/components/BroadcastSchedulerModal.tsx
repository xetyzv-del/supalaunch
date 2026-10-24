import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ExternalLink,
  Globe,
  Monitor,
  Radio,
  Tv,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import type { NewBroadcastPayload } from '../lib/db/repo';
import { istInputToIso, isoToIstInput } from '../lib/format';
import {
  GS_BADGES,
  type BroadcastSource,
  type BroadcastStatus,
  type GSBadge,
} from '../types';

interface BroadcastSchedulerModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewBroadcastPayload) => Promise<void>;
  defaultFacultyName?: string;
}

interface SourceOption {
  id: BroadcastSource;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultUrl: string;
  placeholder: string;
}

const SOURCES: SourceOption[] = [
  {
    id: 'youtube',
    label: 'YouTube Live',
    badge: 'Embed / Watch Stream',
    icon: Youtube,
    description: 'Broadcast to aspirants via unlisted or public YouTube Live stream or embed ID.',
    defaultUrl: 'https://www.youtube.com/watch?v=live_stream',
    placeholder: 'https://youtube.com/watch?v=... or https://youtu.be/...',
  },
  {
    id: 'meet',
    label: 'Google Meet',
    badge: 'Interactive Faculty Room',
    icon: Video,
    description: 'Direct interactive discussion room with two-way voice, screen share, and chat.',
    defaultUrl: 'https://meet.google.com/new',
    placeholder: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'zoom',
    label: 'Zoom Webinar',
    badge: 'Meeting / Webinar ID',
    icon: Tv,
    description: 'High-capacity Zoom meeting or webinar with passcodes and breakout rooms.',
    defaultUrl: 'https://zoom.us/j/1234567890',
    placeholder: 'https://zoom.us/j/...',
  },
  {
    id: 'hls',
    label: 'OBS / Custom HLS',
    badge: 'RTMP / .m3u8 CDN Stream',
    icon: Radio,
    description: 'Connect OBS Studio, vMix, or Wirecast outputting to an HLS (.m3u8) live stream.',
    defaultUrl: 'https://studio.civiledge.in/hls/live.m3u8',
    placeholder: 'https://cdn.example.com/live/stream.m3u8',
  },
  {
    id: 'custom',
    label: 'In-Browser Studio & Deck',
    badge: 'Webcam / Screen Share / Chalkboard',
    icon: Camera,
    description: 'Broadcast directly from this browser using your webcam, microphone, or presentation deck.',
    defaultUrl: 'https://studio.civiledge.in/live/in-browser-room',
    placeholder: 'https://studio.civiledge.in/live/...',
  },
  {
    id: 'vimeo',
    label: 'Vimeo Live',
    badge: 'Vimeo Enterprise Stream',
    icon: Globe,
    description: 'High-definition Vimeo player integration for pro faculty broadcasts.',
    defaultUrl: 'https://vimeo.com/event/1234567',
    placeholder: 'https://vimeo.com/event/... or https://player.vimeo.com/video/...',
  },
];

export function BroadcastSchedulerModal({
  open,
  onClose,
  onCreate,
  defaultFacultyName = 'CivilEdge Faculty',
}: BroadcastSchedulerModalProps) {
  const [broadcastMode, setBroadcastMode] = useState<'live' | 'scheduled'>('live');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<GSBadge>('GS-2');
  const [faculty, setFaculty] = useState(defaultFacultyName);
  const [facultyDesignation, setFacultyDesignation] = useState('Director & Senior UPSC Faculty');
  const [source, setSource] = useState<BroadcastSource>('youtube');
  const [streamUrl, setStreamUrl] = useState('https://www.youtube.com/watch?v=live_stream');
  const [scheduledIst, setScheduledIst] = useState(() => isoToIstInput(new Date().toISOString()));
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [description, setDescription] = useState('');
  const [topicsText, setTopicsText] = useState('Constitutional Mandate & Case Laws\nHorizontal & Vertical Devolution\nMains Scoring Framework');
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [handoutTitle, setHandoutTitle] = useState('');
  const [handoutUrl, setHandoutUrl] = useState('');

  // WebRTC Camera preview in browser
  const [cameraActive, setCameraActive] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamTrackRef = useRef<MediaStream | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync faculty default name if prop changes
  useEffect(() => {
    if (defaultFacultyName) {
      setFaculty(defaultFacultyName);
    }
  }, [defaultFacultyName]);

  // Clean up any camera tracks on close
  useEffect(() => {
    return () => {
      if (streamTrackRef.current) {
        streamTrackRef.current.getTracks().forEach((t) => t.stop());
        streamTrackRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  const handleSourceSelect = (opt: SourceOption) => {
    setSource(opt.id);
    if (!streamUrl || streamUrl.includes('civiledge') || streamUrl.includes('youtube') || streamUrl.includes('zoom') || streamUrl.includes('meet')) {
      setStreamUrl(opt.defaultUrl);
    }
  };

  const handleStartCamera = async () => {
    try {
      if (streamTrackRef.current) {
        streamTrackRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamTrackRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setCameraActive(true);
      setScreenShareActive(false);
      setSource('custom');
      setStreamUrl('https://studio.civiledge.in/live/browser-camera');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access declined or unavailable.');
    }
  };

  const handleStartScreenShare = async () => {
    try {
      if (streamTrackRef.current) {
        streamTrackRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamTrackRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setScreenShareActive(true);
      setCameraActive(false);
      setSource('custom');
      setStreamUrl('https://studio.civiledge.in/live/browser-screenshare');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screen sharing cancelled or unavailable.');
    }
  };

  const handleStopDeviceStream = () => {
    if (streamTrackRef.current) {
      streamTrackRef.current.getTracks().forEach((t) => t.stop());
      streamTrackRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScreenShareActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^https?:\/\//i.test(streamUrl.trim())) {
      setError('Stream or room URL must begin with https:// or http://');
      return;
    }
    setBusy(true);
    try {
      const scheduledIso =
        broadcastMode === 'live'
          ? new Date().toISOString()
          : istInputToIso(scheduledIst);

      await onCreate({
        title: title.trim() || `Live ${subject} Faculty Seminar`,
        subject,
        faculty: faculty.trim() || defaultFacultyName || 'CivilEdge Faculty',
        facultyDesignation: facultyDesignation.trim() || undefined,
        source,
        streamUrl: streamUrl.trim(),
        scheduledAt: scheduledIso,
        durationMinutes,
        status: broadcastMode === 'live' ? 'live' : 'scheduled',
        description: description.trim() || undefined,
        topicsCovered: topicsText
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
        meetingId: meetingId.trim() || undefined,
        meetingPassword: meetingPassword.trim() || undefined,
        handoutTitle: handoutTitle.trim() || undefined,
        handoutUrl: handoutUrl.trim() || undefined,
        chatEnabled: true,
      });

      handleStopDeviceStream();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish broadcast.');
    } finally {
      setBusy(false);
    }
  };

  const selectedSource = SOURCES.find((s) => s.id === source) ?? SOURCES[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Broadcast Class Studio"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-6 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                Live Broadcast Studio &amp; Class Launcher
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast live classes to aspirants from YouTube, Zoom, Meet, OBS, or browser
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStopDeviceStream();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        ) : null}

        {/* Mode Selector: Go Live Now vs Schedule */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setBroadcastMode('live')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              broadcastMode === 'live'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Go Live Immediately (On Stage)</span>
          </button>
          <button
            type="button"
            onClick={() => setBroadcastMode('scheduled')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              broadcastMode === 'scheduled'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Schedule Upcoming Class (Timetable)</span>
          </button>
        </div>

        {/* Multi-Source Selection Grid */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700">
            1. Select Broadcast Source
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SOURCES.map((opt) => {
              const Icon = opt.icon;
              const isSelected = source === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSourceSelect(opt)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/80 text-slate-900 shadow-xs ring-1 ring-amber-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                    {isSelected ? <Check className="w-3.5 h-3.5 text-amber-600" /> : null}
                  </div>
                  <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{opt.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Helper for Google Meet / Zoom / In-Browser Camera */}
        {source === 'meet' ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="text-slate-700">
              <span className="font-semibold text-blue-900">Need a Google Meet link?</span> Create a meeting room instantly with 1-click:
            </div>
            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500 whitespace-nowrap cursor-pointer shadow-xs"
            >
              Launch Meet
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : null}

        {source === 'custom' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                In-Browser WebRTC Camera &amp; Screen Broadcast
              </span>
              {(cameraActive || screenShareActive) && (
                <button
                  type="button"
                  onClick={handleStopDeviceStream}
                  className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Stop Preview
                </button>
              )}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Broadcast directly from your webcam, microphone, or presentation slides without third-party software.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartCamera}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  cameraActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {cameraActive ? 'Camera Active' : 'Start Camera Test'}
              </button>
              <button
                type="button"
                onClick={handleStartScreenShare}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  screenShareActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                {screenShareActive ? 'Sharing Screen' : 'Share Screen / Slides'}
              </button>
            </div>
            {(cameraActive || screenShareActive) && (
              <div className="relative aspect-video w-full max-h-48 rounded-xl overflow-hidden bg-black border border-emerald-400">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-rose-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  Preview Active
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Main Broadcast Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class / Seminar Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterclass: Article 280 & 16th Finance Commission Devolution"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">GS Paper / Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as GSBadge)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {GS_BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Faculty Name</label>
              <input
                type="text"
                required
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="Dr. S. Sharma / Faculty Mentor"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={facultyDesignation}
                onChange={(e) => setFacultyDesignation(e.target.value)}
                placeholder="Director & UPSC Faculty"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Stream URL Input */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Stream / Room / Live URL ({selectedSource.label})
            </label>
            <input
              type="url"
              required
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder={selectedSource.placeholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
            />
          </div>

          {/* Zoom / Meet Credentials */}
          {(source === 'zoom' || source === 'meet') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Meeting ID / Room Code</label>
                <input
                  type="text"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="e.g. 849 2011 3920"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Passcode (Optional)</label>
                <input
                  type="text"
                  value={meetingPassword}
                  onChange={(e) => setMeetingPassword(e.target.value)}
                  placeholder="e.g. UPSC2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Date & Time if Scheduled */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                {broadcastMode === 'live' ? 'Broadcast Starts At' : 'Scheduled Date & Time (IST)'}
              </label>
              <input
                type="datetime-local"
                required
                disabled={broadcastMode === 'live'}
                value={scheduledIst}
                onChange={(e) => setScheduledIst(e.target.value)}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none ${
                  broadcastMode === 'live' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimated Duration (mins)</label>
              <input
                type="number"
                min={15}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Seminar Synopsis / Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed conceptual analysis, landmark SC cases, and Mains answer writing framework..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Board Modules / Topics (one per line)</label>
            <textarea
              rows={3}
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              placeholder="Module 1: Constitutional Articles&#10;Module 2: Analytical Dimensions&#10;Module 3: Mains PYQ Framework"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Handout Title (Optional)</label>
              <input
                type="text"
                value={handoutTitle}
                onChange={(e) => setHandoutTitle(e.target.value)}
                placeholder="e.g. Fiscal_Federalism_Crux.pdf"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Handout Download URL (Optional)</label>
              <input
                type="url"
                value={handoutUrl}
                onChange={(e) => setHandoutUrl(e.target.value)}
                placeholder="https://civiledge.in/handouts/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Broadcasting as <strong className="text-amber-600 font-semibold">{faculty}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleStopDeviceStream();
                  onClose();
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  broadcastMode === 'live'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                } disabled:opacity-50`}
              >
                {busy ? (
                  'Publishing…'
                ) : broadcastMode === 'live' ? (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Go Live On Stage Now</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Publish Class to Timetable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
