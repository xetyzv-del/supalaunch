/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Filter,
  Layers,
  Send,
  FileText,
  History,
} from 'lucide-react';
import type {
  MainsQuestion,
  MainsSubmissionRecord,
  GSBadge,
} from '../types/index.ts';

interface MainsWritingLabProps {
  questions: MainsQuestion[];
  pastSubmissions?: MainsSubmissionRecord[];
  submissions?: MainsSubmissionRecord[];
  isStaff?: boolean;
  onSubmitAnswer?: (
    question: MainsQuestion,
    answerText: string
  ) => Promise<MainsSubmissionRecord | any>;
  onEvaluate?: (
    question: MainsQuestion,
    answerText: string
  ) => Promise<MainsSubmissionRecord | any>;
  onDeleteQuestion?: (id: string) => Promise<any>;
}

export const MainsWritingLab: React.FC<MainsWritingLabProps> = ({
  questions,
  pastSubmissions,
  submissions,
  isStaff,
  onSubmitAnswer,
  onEvaluate,
  onDeleteQuestion,
}) => {
  const historySubmissions = submissions || pastSubmissions || [];
  const evaluateHandler = onEvaluate || onSubmitAnswer;
  const [selectedPaper, setSelectedPaper] = useState<string>('All');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    questions[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [answerText, setAnswerText] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showFramework, setShowFramework] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] =
    useState<MainsSubmissionRecord | null>(null);

  const selectedQuestion =
    questions.find((q) => q.id === selectedQuestionId) || questions[0];

  const filteredQuestions = questions.filter((q) => {
    if (selectedPaper !== 'All' && q.gsPaper !== selectedPaper) return false;
    return true;
  });

  // Reset answer text and timer when switching questions
  useEffect(() => {
    setAnswerText('');
    setShowFramework(false);
    setCurrentEvaluation(null);
    if (selectedQuestion) {
      setTimerSeconds(selectedQuestion.suggestedTimeMin * 60);
      setIsTimerRunning(false);
    }
  }, [selectedQuestionId]);

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const wordCount = answerText.trim() === '' ? 0 : answerText.trim().split(/\s+/).length;
  const wordLimit = selectedQuestion?.wordLimit || 250;
  const wordPercentage = Math.min(100, Math.round((wordCount / wordLimit) * 100));

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedQuestion || wordCount < 30 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (evaluateHandler) {
        const result = await evaluateHandler(selectedQuestion, answerText);
        if (result) {
          setCurrentEvaluation(result);
        }
      }
    } catch (err) {
      console.error('Failed to submit Mains answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-white via-amber-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-3">
              <PenTool className="w-3.5 h-3.5 text-amber-700" />
              Mains Daily Answer Writing (DAW)
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Mains Analytical Writing Laboratory
            </h2>
            <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">
              Standard UPSC 10-marker (150 words) and 15-marker (250 words) daily analytical
              questions with structural dimensions, statutory citations, and instant evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              Writing Desk
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4 inline mr-1.5" />
              Evaluation History ({historySubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Questions Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Question
                </span>
                <select
                  value={selectedPaper}
                  onChange={(e) => setSelectedPaper(e.target.value)}
                  className="text-xs font-medium bg-stone-100 border border-stone-200 text-stone-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="All">All Papers</option>
                  <option value="GS-1">GS-1</option>
                  <option value="GS-2">GS-2</option>
                  <option value="GS-3">GS-3</option>
                  <option value="GS-4">GS-4</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredQuestions.map((q) => {
                  const isSelected = q.id === selectedQuestion?.id;
                  const isAttempted = historySubmissions.some((s) => s.questionId === q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestionId(q.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-xs'
                          : 'bg-stone-50/70 hover:bg-stone-100/70 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {q.gsPaper}
                        </span>
                        <span className="text-stone-500">
                          {q.marks} Marks • {q.wordLimit} Words
                        </span>
                      </div>
                      <p className="font-serif font-bold text-xs text-stone-900 line-clamp-2 leading-snug">
                        {q.prompt}
                      </p>
                      {isAttempted && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Submitted</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Writing Canvas & Evaluation (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedQuestion && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                {/* Question Details Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                      {selectedQuestion.gsPaper}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      {selectedQuestion.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-stone-600">
                    <span>{selectedQuestion.marks} Marks</span>
                    <span>•</span>
                    <span>{selectedQuestion.wordLimit} Words</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedQuestion.suggestedTimeMin} mins</span>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="my-5">
                  <p className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-relaxed">
                    {selectedQuestion.prompt}
                  </p>
                </div>

                {/* Structural Framework Collapsible */}
                <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/40 overflow-hidden transition-all">
                  <button
                    onClick={() => setShowFramework((prev) => !prev)}
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-amber-900 hover:bg-amber-100/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <span>Mains 4-Step Structural Blueprint & Dimensions</span>
                    </div>
                    {showFramework ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showFramework && (
                    <div className="p-4 pt-1 space-y-4 text-xs text-stone-700 border-t border-amber-200/50">
                      <div>
                        <span className="font-bold text-stone-900 uppercase tracking-wide">
                          1. Introduction:
                        </span>
                        <p className="mt-0.5 text-stone-600 leading-relaxed">
                          {selectedQuestion.framework.intro}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-stone-900 uppercase tracking-wide">
                          2. Analytical Dimensions:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {selectedQuestion.framework.dimensions.map((dim, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-xs"
                            >
                              <div className="font-semibold text-amber-950">{dim.title}</div>
                              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-stone-600">
                                {dim.points.map((pt, pIdx) => (
                                  <li key={pIdx}>{pt}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-stone-900 uppercase tracking-wide">
                          3. Statutory / Data Anchors:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedQuestion.framework.statutoryOrDataRefs.map((ref, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-white border border-stone-200 font-mono text-[11px] text-stone-800"
                            >
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-stone-900 uppercase tracking-wide">
                          4. Conclusion & Way Forward:
                        </span>
                        <p className="mt-0.5 text-stone-600 leading-relaxed">
                          {selectedQuestion.framework.conclusion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer Writing Canvas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsTimerRunning((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                          isTimerRunning
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimer(timerSeconds)}</span>
                        <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 font-medium">
                      <span
                        className={
                          wordCount > wordLimit
                            ? 'text-rose-600 font-bold'
                            : wordCount >= wordLimit * 0.8
                            ? 'text-emerald-700 font-bold'
                            : 'text-stone-500'
                        }
                      >
                        {wordCount} / {wordLimit} words
                      </span>
                    </div>
                  </div>

                  {/* Word limit progress bar */}
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        wordCount > wordLimit ? 'bg-rose-500' : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(100, (wordCount / wordLimit) * 100)}%` }}
                    />
                  </div>

                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Draft your analytical answer adhering to the structural blueprint: Context/Intro -> Core Multi-dimensional Arguments -> Empirical/Statutory Evidence -> Balanced Conclusion..."
                    rows={12}
                    className="w-full p-4 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm font-sans leading-relaxed resize-y focus:outline-none transition-all placeholder:text-stone-400"
                  />

                  {/* Submission Row */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-stone-500">
                      Minimum 30 words required for rubric evaluation.
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={wordCount < 30 || isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Evaluating Rubric...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit for Evaluation
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Current Instant Evaluation Card */}
                {currentEvaluation && (
                  <div className="mt-8 p-6 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 shadow-xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <h4 className="font-serif font-bold text-base text-stone-100">
                          Mains Rubric Evaluation Result
                        </h4>
                      </div>
                      <div className="text-lg font-serif font-bold text-amber-400">
                        {currentEvaluation.score} / {currentEvaluation.maxMarks} Marks
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      {currentEvaluation.feedback}
                    </p>

                    {currentEvaluation.evaluation && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-stone-950/80 border border-emerald-900/40">
                          <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Demonstrated Strengths
                          </div>
                          <ul className="text-[11px] text-stone-300 space-y-1 list-disc list-inside">
                            {currentEvaluation.evaluation.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-950/80 border border-amber-900/40">
                          <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Recommended Enhancements
                          </div>
                          <ul className="text-[11px] text-stone-300 space-y-1 list-disc list-inside">
                            {currentEvaluation.evaluation.improvements.map((im, idx) => (
                              <li key={idx}>{im}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Past Submissions History View */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Mains Answer History & Evaluator Feedbacks
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {historySubmissions.length} answers logged
            </span>
          </div>

          {historySubmissions.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
              <PenTool className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h4 className="font-serif text-lg font-medium text-stone-700">
                No answers submitted yet
              </h4>
              <p className="text-stone-500 text-sm mt-1">
                Select a daily mains question and submit your first timed analytical response.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-stone-200 hover:border-amber-400 transition-all bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <p className="font-serif font-bold text-sm text-stone-900 leading-snug">
                      {sub.questionPrompt}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                        {sub.score !== null ? `${sub.score}/${sub.maxMarks} Marks` : 'Pending'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-stone-600 leading-relaxed font-sans bg-stone-50 p-3 rounded-lg border border-stone-100 line-clamp-3">
                    {sub.answerText}
                  </div>

                  <div className="mt-3 text-xs text-stone-700 flex items-start gap-2">
                    <span className="font-semibold text-stone-900 shrink-0">
                      Evaluator Notes:
                    </span>
                    <span>{sub.feedback}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
