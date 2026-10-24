/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Filter,
  CheckCircle2,
  BookOpen,
  Sparkles,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import type { Quiz, QuizQuestion, TestAttemptRecord, GSBadge } from '../types/index.ts';

interface QuizHubProps {
  quizzes: Quiz[];
  attempts?: TestAttemptRecord[];
  pastAttempts?: TestAttemptRecord[];
  questions?: QuizQuestion[];
  isStaff?: boolean;
  onStartQuiz: (quiz: Quiz) => void;
  onStartRapidDrill?: (gsPaper?: GSBadge) => void;
  onTogglePublish?: (quizId: string, nextPublished: boolean) => Promise<any>;
  onDeleteQuiz?: (quizId: string) => Promise<any>;
  onOpenAdminImport?: () => void;
}

export const QuizHub: React.FC<QuizHubProps> = ({
  quizzes,
  attempts,
  pastAttempts,
  questions = [],
  isStaff,
  onStartQuiz,
  onStartRapidDrill,
  onTogglePublish,
  onDeleteQuiz,
  onOpenAdminImport,
}) => {
  const historyAttempts = attempts || pastAttempts || [];
  const [selectedPaper, setSelectedPaper] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('all');

  const papers = ['All', 'GS-1', 'GS-2', 'CSAT'];

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedPaper !== 'All' && q.gsPaper !== selectedPaper) return false;
    if (selectedType !== 'all' && q.testType !== selectedType) return false;
    return true;
  });

  // Calculate high-level stats
  const totalAttempted = historyAttempts.length;
  const avgAccuracy =
    totalAttempted > 0
      ? Math.round(
          historyAttempts.reduce((acc, cur) => acc + cur.accuracy, 0) / totalAttempted
        )
      : 0;
  const highestScore =
    totalAttempted > 0 ? Math.max(...historyAttempts.map((a) => a.score)) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner: Prelims MCQ Command Center */}
      <div className="bg-gradient-to-br from-white via-amber-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              UPSC Prelims Standard MCQ Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Prelims Examination Drill Hub
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
              Bilingual UPSC prelims-standard questions with assertion-reasoning, paired
              statements, negative marking (-0.66 marks), and detailed statutory citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartRapidDrill?.()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              10-MCQ Rapid Drill
            </button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-200/80">
          <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Question Bank</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-0.5">
              {questions.length}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">verified</span>
            </div>
          </div>
          <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Tests Attempted</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-0.5">
              {totalAttempted}
            </div>
          </div>
          <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Avg Accuracy</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 mt-0.5">
              {avgAccuracy}%
            </div>
          </div>
          <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Best Score</div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-amber-700 mt-0.5">
              {highestScore.toFixed(1)} <span className="text-xs font-normal text-slate-500">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            GS Paper:
          </span>
          {papers.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPaper(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPaper === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-xs"
          >
            <option value="all">All Formats</option>
            <option value="mock_test">Full Mock Tests</option>
            <option value="mcq_drill">Targeted Drills</option>
            <option value="topic_quiz">Topic Quizzes</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredQuizzes.map((quiz) => {
          const pastAttempt = historyAttempts
            .filter((a) => a.testId === quiz.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          return (
            <div
              key={quiz.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all p-5 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {quiz.gsPaper}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {quiz.testType.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{quiz.subject}</p>

                <div className="flex items-center gap-4 mt-4 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>{quiz.questionIds.length} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{quiz.durationMinutes} mins</span>
                  </div>
                </div>

                {pastAttempt && (
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium text-slate-700">Last Attempt:</span>
                      <span className="font-semibold text-emerald-700">
                        {pastAttempt.score.toFixed(1)} / {pastAttempt.maxMarks} marks
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-slate-500">
                      <span>Accuracy: {pastAttempt.accuracy}%</span>
                      <span>{new Date(pastAttempt.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  +2.00 / -0.66 marking
                </span>
                <button
                  onClick={() => onStartQuiz(quiz)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  {pastAttempt ? 'Retake Test' : 'Start Test'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-serif text-lg font-medium text-slate-800">
            No tests found for selected filter
          </h4>
          <p className="text-slate-500 text-sm mt-1">
            Try switching to 'All Papers' or initiate a 10-MCQ Rapid Drill.
          </p>
        </div>
      )}

      {/* Past Attempts Table if any */}
      {historyAttempts.length > 0 && (
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              Recent Prelims Attempt Log
            </h3>
            <span className="text-xs text-slate-500">
              {historyAttempts.length} total attempts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Correct / Total</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Attempted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {historyAttempts.slice(0, 5).map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {attempt.testTitle}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-slate-900">
                      {attempt.score.toFixed(1)} / {attempt.maxMarks}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold">{attempt.correct}</span> /{' '}
                      {attempt.correct + attempt.incorrect + attempt.unattempted}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          attempt.accuracy >= 70
                            ? 'bg-emerald-50 text-emerald-800'
                            : attempt.accuracy >= 50
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {attempt.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {Math.floor(attempt.timeTakenSeconds / 60)}m{' '}
                      {attempt.timeTakenSeconds % 60}s
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(attempt.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
