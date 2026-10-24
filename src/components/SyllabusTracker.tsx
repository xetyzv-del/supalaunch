/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Filter,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import type { SyllabusPaper, SyllabusImportance, GSBadge } from '../types/index.ts';

interface SyllabusTrackerProps {
  papers?: SyllabusPaper[];
  syllabusData?: SyllabusPaper[];
  onToggleSubtopic: (arg1: any, arg2?: any, arg3?: any) => Promise<any> | void;
}

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({
  papers,
  syllabusData,
  onToggleSubtopic,
}) => {
  const activePapers = papers || syllabusData || [];
  const [selectedPaper, setSelectedPaper] = useState<GSBadge>('GS-2');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const handleToggle = (paper: GSBadge, subtopicId: string, completed: boolean) => {
    // Check if onToggleSubtopic expects (subtopicId, completed) or (paper, subtopicId, completed)
    if (onToggleSubtopic.length === 2) {
      void onToggleSubtopic(subtopicId, completed);
    } else {
      void onToggleSubtopic(paper, subtopicId, completed);
    }
  };

  // Overall Completion stats
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    const paperBreakdown: Record<string, { total: number; completed: number }> = {};

    activePapers.forEach((p) => {
      let pTotal = p.subtopics.length;
      let pCompleted = p.subtopics.filter((s) => s.completed).length;
      total += pTotal;
      completed += pCompleted;
      paperBreakdown[p.paper] = { total: pTotal, completed: pCompleted };
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent, paperBreakdown };
  }, [activePapers]);

  const activePaperData =
    activePapers.find((p) => p.paper === selectedPaper) || activePapers[0];

  const filteredSubtopics = useMemo(() => {
    if (!activePaperData) return [];
    return activePaperData.subtopics.filter((st) => {
      if (filterImportance !== 'all' && st.importance !== filterImportance) return false;
      if (filterStatus === 'completed' && !st.completed) return false;
      if (filterStatus === 'pending' && st.completed) return false;
      return true;
    });
  }, [activePaperData, filterImportance, filterStatus]);

  const getImportanceBadge = (importance: SyllabusImportance) => {
    switch (importance) {
      case 'High Priority':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Frequent PYQs':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Core Standard':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-white via-amber-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              UPSC Official Syllabus Coverage
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Civil Services Micro-Syllabus Tracker
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
              Track granular subtopics across GS-1, GS-2, GS-3, GS-4 &amp; CSAT. Highlighted with
              frequency weights from past 10 years UPSC CSE Prelims &amp; Mains question papers.
            </p>
          </div>

          {/* Aggregate Completion Pill */}
          <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Overall Coverage</div>
              <div className="text-2xl font-serif font-bold text-emerald-700 mt-0.5">
                {stats.percent}%
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.completed} of {stats.total} micro-topics
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-slate-50 border-4 border-slate-200 flex items-center justify-center relative overflow-hidden shadow-xs">
              <div
                className="absolute inset-0 bg-emerald-500/20"
                style={{ height: `${stats.percent}%`, top: 'auto', bottom: 0 }}
              />
              <TrendingUp className="w-6 h-6 text-emerald-600 relative z-10" />
            </div>
          </div>
        </div>

        {/* Paper Progress Mini Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200/80">
          {activePapers.map((p) => {
            const b = stats.paperBreakdown[p.paper] || { total: 0, completed: 0 };
            const pPct = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
            const isSelected = p.paper === selectedPaper;

            return (
              <button
                key={p.paper}
                onClick={() => setSelectedPaper(p.paper)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white/80 border-slate-200 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-slate-900">{p.paper}</span>
                  <span className="font-semibold text-amber-700">{pPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pPct}%` }} />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{p.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Subtopic Checklist Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {activePaperData?.paper}: {activePaperData?.title}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Click checkboxes to record topic completion in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-500 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-stone-100 border border-stone-200 text-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Topics</option>
                <option value="pending">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-500 font-medium">Priority:</span>
              <select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                className="bg-stone-100 border border-stone-200 text-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="High Priority">High Priority</option>
                <option value="Frequent PYQs">Frequent PYQs</option>
                <option value="Core Standard">Core Standard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subtopics Checklist Items */}
        <div className="mt-6 divide-y divide-stone-100">
          {filteredSubtopics.map((st) => (
            <div
              key={st.id}
              onClick={() => handleToggle(selectedPaper, st.id, !st.completed)}
              className="py-3.5 px-3 rounded-xl hover:bg-stone-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-stone-400 group-hover:text-stone-700 transition-colors shrink-0"
                >
                  {st.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300" />
                  )}
                </button>
                <span
                  className={`text-sm font-medium transition-colors ${
                    st.completed
                      ? 'text-stone-400 line-through decoration-stone-300'
                      : 'text-stone-800'
                  }`}
                >
                  {st.name}
                </span>
              </div>

              <div className="shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getImportanceBadge(
                    st.importance
                  )}`}
                >
                  {st.importance}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredSubtopics.length === 0 && (
          <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200 mt-4">
            <Compass className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-600 text-sm font-medium">
              No subtopics match the active filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
