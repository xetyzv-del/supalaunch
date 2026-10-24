import { useState } from 'react';
import { CalendarPlus, PlayCircle, Radio } from 'lucide-react';
import { formatScheduleIST } from '../lib/format';
import type { BroadcastClass } from '../types';

interface TimetableSectionProps {
  broadcasts: BroadcastClass[];
  isStaff: boolean;
  onSelectClass: (b: BroadcastClass) => void;
  onOpenScheduler: () => void;
}

export function TimetableSection({
  broadcasts,
  isStaff,
  onSelectClass,
  onOpenScheduler,
}: TimetableSectionProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filtered = broadcasts.filter((b) => {
    if (filter === 'upcoming') return b.status === 'live' || b.status === 'scheduled';
    if (filter === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Academic Seminar Timetable
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            All faculty sessions are synchronized to Indian Standard Time (IST · UTC+5:30).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            {(
              [
                { id: 'all', label: 'All Sessions' },
                { id: 'upcoming', label: 'Live & Upcoming' },
                { id: 'completed', label: 'Recorded Archive' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isStaff ? (
            <button
              type="button"
              onClick={onOpenScheduler}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs transition-all cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Schedule Seminar
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-amber-50/20 p-10 text-center space-y-4 shadow-xs">
          <p className="font-serif text-lg font-semibold text-slate-900">
            No seminars scheduled yet
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All presaved dummy schedules have been cleaned out. You can now publish your own classes from YouTube, Zoom, Google Meet, OBS, or browser webcam.
          </p>
          {isStaff ? (
            <button
              type="button"
              onClick={onOpenScheduler}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Schedule / Broadcast First Class
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cls) => (
            <article
              key={cls.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-amber-400/80 hover:shadow-md transition-all shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-amber-700">
                    {cls.subject} · {cls.source.toUpperCase()}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-semibold uppercase ${
                      cls.status === 'live'
                        ? 'text-emerald-700 font-bold'
                        : cls.status === 'scheduled'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {cls.status === 'live' ? '● Live Now' : cls.status}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug">
                  {cls.title}
                </h3>

                <p className="text-xs text-slate-500">
                  {cls.faculty}
                  {cls.facultyDesignation ? ` · ${cls.facultyDesignation}` : ''}
                </p>

                {cls.description ? (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {cls.description}
                  </p>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {formatScheduleIST(cls.scheduledAt)} · {cls.durationMinutes}m
                </span>

                <button
                  type="button"
                  onClick={() => onSelectClass(cls)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                >
                  {cls.status === 'live' ? (
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {cls.status === 'live' ? 'Join Live' : 'Open Stage'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
