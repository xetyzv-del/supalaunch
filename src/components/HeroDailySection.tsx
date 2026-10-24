import { useState } from 'react';
import { ArrowUpRight, BookOpenCheck, FileText, Network, PenTool, Radio, Trash2 } from 'lucide-react';
import { formatPublishDate } from '../lib/format';
import type { BroadcastClass, InfographicItem, TopicOfDay } from '../types';
import { DailyCruxCarousel } from './DailyCruxCarousel';

interface HeroDailySectionProps {
  topics: TopicOfDay[];
  liveClass: BroadcastClass | null;
  isStaff: boolean;
  onOpenBrief: (topic: TopicOfDay) => void;
  onDeleteTopic: (id: string) => Promise<void>;
  onUpdateInfographics?: (topicId: string, infographics: InfographicItem[]) => Promise<void>;
  onJumpClassroom: () => void;
  onJumpPrelims: () => void;
  onJumpMains: () => void;
}

const NODE_ACCENT: Record<string, { border: string; title: string; bg: string }> = {
  slate: {
    border: 'border-slate-200',
    title: 'text-slate-900',
    bg: 'bg-white',
  },
  emerald: {
    border: 'border-emerald-200/80',
    title: 'text-emerald-900',
    bg: 'bg-emerald-50/40',
  },
  amber: {
    border: 'border-amber-200/80',
    title: 'text-amber-900',
    bg: 'bg-amber-50/40',
  },
  rose: {
    border: 'border-rose-200/80',
    title: 'text-rose-900',
    bg: 'bg-rose-50/40',
  },
};

export function HeroDailySection({
  topics,
  liveClass,
  isStaff,
  onOpenBrief,
  onDeleteTopic,
  onUpdateInfographics,
  onJumpClassroom,
  onJumpPrelims,
  onJumpMains,
}: HeroDailySectionProps) {
  const [selectedId, setSelectedId] = useState<string>(topics[0]?.id ?? '');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeTopic = topics.find((t) => t.id === selectedId) ?? topics[0];

  if (!activeTopic) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 shadow-xs">
        No Daily Crux editorial has been published yet. Staff can publish one from Admin Studio.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {liveClass ? (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Radio className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-800 truncate">
              <span className="font-bold text-amber-900">Live Seminar Now:</span>{' '}
              {liveClass.title}{' '}
              <span className="text-slate-500">· {liveClass.faculty}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onJumpClassroom}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 whitespace-nowrap cursor-pointer"
          >
            Enter Classroom Stage
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {topics.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            Editorial Crux Archive
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {topics.map((t) => {
              const active = t.id === activeTopic.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id);
                    setConfirmDeleteId(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {formatPublishDate(t.publishDate)} · {t.gsPaper}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/80 to-amber-50/20 p-6 sm:p-8 lg:p-10 space-y-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs font-bold text-amber-700 tracking-wide uppercase">
              {activeTopic.gsPaper} · {activeTopic.category} · {formatPublishDate(activeTopic.publishDate)} ·{' '}
              <span className="tabular-nums">{activeTopic.readTimeMinutes} min read</span>
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
              {activeTopic.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Primary Anchor: <span className="text-slate-800 font-semibold">{activeTopic.source}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenBrief(activeTopic)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Read Revision Brief
            </button>

            {isStaff && topics.length > 1 ? (
              confirmDeleteId === activeTopic.id ? (
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteTopic(activeTopic.id);
                    setConfirmDeleteId(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  Confirm Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(activeTopic.id)}
                  title="Delete this Daily Crux edition"
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-rose-600 hover:border-rose-300 shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-y border-slate-200/90 py-5">
          {activeTopic.keyArticlesOrData.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <dt className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {item.label}
              </dt>
              <dd className="font-mono text-xs sm:text-sm text-slate-900 font-bold">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Daily Infographics & Analytical Carousel */}
        <DailyCruxCarousel
          topicId={activeTopic.id}
          topicTitle={activeTopic.title}
          infographics={activeTopic.infographics ?? []}
          isStaff={isStaff}
          onUpdateInfographics={async (id, updated) => {
            if (onUpdateInfographics) {
              await onUpdateInfographics(id, updated);
            }
          }}
        />

        <div className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Editorial Synthesis for Prelims &amp; Mains
          </h2>
          <ol className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeTopic.summaryBullets.map((bullet, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3.5 shadow-xs"
              >
                <span className="font-mono text-xs font-bold text-amber-600 tabular-nums mt-0.5">
                  0{idx + 1}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">{bullet}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-600" />
              360° Analytical Dimensions
            </h2>
            <span className="text-xs text-slate-500 font-medium">Mains 250-Word Structure Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTopic.mindmapNodes.map((node, idx) => {
              const accent = NODE_ACCENT[node.color] ?? NODE_ACCENT.slate;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 space-y-3 shadow-xs ${accent.border} ${accent.bg}`}
                >
                  <h3 className={`text-sm font-bold ${accent.title}`}>
                    {node.title}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {node.items.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 select-none font-bold">–</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            Consolidate today&apos;s crux with active recall across Prelims MCQs and Mains answer writing.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onJumpPrelims}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-amber-600" />
              Attempt Prelims Drill
            </button>
            <button
              type="button"
              onClick={onJumpMains}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-600" />
              Draft Mains Answer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
