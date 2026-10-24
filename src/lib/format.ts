import type { ResourceCategory, ResourceItem, TopicOfDay, UserProfileData } from '../types';

export const IST = 'Asia/Kolkata';
const IST_OFFSET_MIN = 330;

export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function istISO(baseDate: string, offsetDays: number, hhmm: string): string {
  const [y, m, d] = baseDate.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const utc = Date.UTC(y, m - 1, d + offsetDays, hh, mm) - IST_OFFSET_MIN * 60_000;
  return new Date(utc).toISOString();
}

export function isoToIstInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MIN * 60_000);
  return d.toISOString().slice(0, 16);
}

export function istInputToIso(value: string): string {
  const [date, time] = value.split('T');
  return istISO(date, 0, time || '00:00');
}

export function formatDateTimeIST(iso: string): string {
  return (
    new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso)) + ' IST'
  );
}

export function formatTimeIST(iso: string): string {
  return (
    new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(iso))
      .toUpperCase() + ' IST'
  );
}

export function formatDayIST(iso: string, now: Date = new Date()): string {
  const day = todayIST(new Date(iso));
  const today = todayIST(now);
  const diff = Math.round((Date.parse(day) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatScheduleIST(iso: string): string {
  return `${formatDayIST(iso)} · ${formatTimeIST(iso)}`;
}

export function formatPublishDate(date: string): string {
  const today = todayIST();
  const pretty = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
  return date === today ? `Today · ${pretty}` : pretty;
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 45) return 'Just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function formatScore(score: number | null, max: number): string {
  return score === null ? 'Pending' : `${score} / ${max}`;
}

export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  ncert: 'Foundational NCERT',
  standard: 'Standard Reference',
  yojana: 'Official Magazine',
  pib: 'Press Information Bureau',
  pyq: 'Previous Year Papers',
  user: 'Aspirant Upload',
};

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function normalizeProfile(p: UserProfileData, now: Date = new Date()): UserProfileData {
  if (!p.lastStudyDate) return { ...p, studyMinutes: 0, streakDays: 0 };
  const today = todayIST(now);
  const gap = Math.round((Date.parse(today) - Date.parse(p.lastStudyDate)) / 86_400_000);
  if (gap <= 0) return p;
  return { ...p, studyMinutes: 0, streakDays: gap === 1 ? p.streakDays : 0 };
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'CE'
  );
}

export function buildTopicBriefMarkdown(topic: TopicOfDay): string {
  const lines: string[] = [
    `# ${topic.title}`,
    ``,
    `**Paper:** ${topic.gsPaper} · **Category:** ${topic.category}`,
    `**Source:** ${topic.source} · **Published:** ${topic.publishDate}`,
    ``,
    `---`,
    ``,
    `## 1. Editorial Crux & Conceptual Synthesis`,
    ...topic.summaryBullets.map((b, i) => `${i + 1}. ${b}`),
    ``,
    `## 2. Constitutional, Statutory & Empirical Anchors`,
    ...topic.keyArticlesOrData.map((d) => `- **${d.label}:** ${d.value}`),
    ``,
    `## 3. Multi-Dimensional Analytical Matrix`,
    ...topic.mindmapNodes.flatMap((n) => [
      `### ${n.title}`,
      ...n.items.map((item) => `- ${item}`),
      ``,
    ]),
    `---`,
    `*CivilEdge IAS Revision Brief — Prepared for UPSC Civil Services Examination*`,
  ];
  return lines.join('\n');
}

export function buildResourceSynopsisMarkdown(res: ResourceItem): string {
  const lines: string[] = [
    `# ${res.title}`,
    ``,
    `**Paper:** ${res.gsPaper} · **Category:** ${CATEGORY_LABELS[res.category]}`,
    `**Author / Source:** ${res.authorOrSource}${res.pages ? ` · **Length:** ${res.pages} pages` : ''}`,
    ``,
    `---`,
    ``,
    `## Executive Synopsis`,
    res.summary,
    ``,
    `## High-Yield Syllabus Anchors Covered`,
    ...(res.topicsCovered.length > 0
      ? res.topicsCovered.map((t, i) => `${i + 1}. ${t}`)
      : ['- Core UPSC General Studies conceptual foundation']),
    ``,
    `## Revision Checklist for Aspirants`,
    `- Map every statutory/constitutional provision above to recent Supreme Court & Parliamentary developments.`,
    `- Cross-reference with the CivilEdge Prelims Drill and Mains Lab frameworks for ${res.gsPaper}.`,
    `- Distill 150-word and 250-word value-addition hooks into your personal revision notebook.`,
    ``,
    `---`,
    `*CivilEdge IAS Central Academic Repository*`,
  ];
  return lines.join('\n');
}

export function triggerBlobDownload(filename: string, content: string, mimeType = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
