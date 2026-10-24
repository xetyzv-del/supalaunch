/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Languages,
  BookOpen,
  Award,
  BarChart,
  Check,
} from 'lucide-react';
import type { Quiz, QuizQuestion, TestAttemptRecord, SubjectScore } from '../types/index.ts';

interface QuizEngineProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onExit: () => void;
  onSaveAttempt: (attempt: Omit<TestAttemptRecord, 'id' | 'createdAt'>) => Promise<any>;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  quiz,
  questions,
  onExit,
  onSaveAttempt,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(quiz.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasSavedAttempt, setHasSavedAttempt] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);

  // Timer Countdown
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  };

  const handleClearResponse = () => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleToggleReview = () => {
    if (isSubmitted) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  // Status counts for palette
  const answeredCount = Object.keys(selectedAnswers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = questions.length - answeredCount;

  // Evaluation calculations
  const evaluatedResults = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    const subjectMap: Record<string, { total: number; correct: number; incorrect: number }> = {};

    questions.forEach((q, idx) => {
      const subj = q.subject || 'General Studies';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { total: 0, correct: 0, incorrect: 0 };
      }
      subjectMap[subj].total += 1;

      const userChoice = selectedAnswers[idx];
      if (userChoice !== undefined) {
        if (userChoice === q.correctIndex) {
          correct += 1;
          subjectMap[subj].correct += 1;
        } else {
          incorrect += 1;
          subjectMap[subj].incorrect += 1;
        }
      }
    });

    const unattempted = questions.length - (correct + incorrect);
    // UPSC marking: +2 for correct, -0.66 for incorrect
    const rawScore = correct * 2.0 - incorrect * 0.66;
    const score = Math.max(0, Number(rawScore.toFixed(2)));
    const maxMarks = questions.length * 2;
    const accuracy =
      correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    const timeSpent = quiz.durationMinutes * 60 - timeRemainingSeconds;

    const subjectWise: SubjectScore[] = Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      total: data.total,
      correct: data.correct,
      incorrect: data.incorrect,
      marks: Number((data.correct * 2.0 - data.incorrect * 0.66).toFixed(2)),
    }));

    return {
      correct,
      incorrect,
      unattempted,
      score,
      maxMarks,
      accuracy,
      timeSpent,
      subjectWise,
    };
  }, [isSubmitted, questions, selectedAnswers, quiz.durationMinutes, timeRemainingSeconds]);

  const handleAutoSubmit = () => {
    setShowSubmitModal(false);
    setIsSubmitted(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitted(true);
  };

  const handlePersistResults = async () => {
    if (hasSavedAttempt || savingAttempt) return;
    setSavingAttempt(true);
    try {
      await onSaveAttempt({
        testId: quiz.id,
        testTitle: quiz.title,
        score: evaluatedResults.score,
        maxMarks: evaluatedResults.maxMarks,
        accuracy: evaluatedResults.accuracy,
        percentile: 85.5,
        correct: evaluatedResults.correct,
        incorrect: evaluatedResults.incorrect,
        unattempted: evaluatedResults.unattempted,
        timeTakenSeconds: evaluatedResults.timeSpent,
        subjectWise: evaluatedResults.subjectWise,
      });
      setHasSavedAttempt(true);
    } catch (err) {
      console.error('Failed to save test attempt:', err);
    } finally {
      setSavingAttempt(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white/95 backdrop-blur-md text-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Exit Test"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {quiz.gsPaper}
              </span>
              <h1 className="font-serif font-bold text-sm sm:text-base text-slate-900 truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Question {currentIndex + 1} of {questions.length} • +2.0 / -0.66 Negative Marking
            </p>
          </div>
        </div>

        {/* Right controls: Language toggle, Timer, Submit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-700" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {!isSubmitted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs ${
                timeRemainingSeconds < 300
                  ? 'bg-rose-50 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          )}

          {!isSubmitted && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Finish &amp; Submit
            </button>
          )}

          {isSubmitted && (
            <button
              onClick={onExit}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              Back to Hub
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {!isSubmitted ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question & Options Area (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
            <div>
              {/* Question metadata badge */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                  <span className="font-serif font-bold text-stone-800 text-sm">
                    Q.{currentIndex + 1}
                  </span>
                  <span>•</span>
                  <span>{currentQ.subject}</span>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">{currentQ.topic}</span>
                </div>
                <button
                  onClick={handleToggleReview}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    markedForReview[currentIndex]
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      markedForReview[currentIndex] ? 'fill-amber-600 text-amber-600' : ''
                    }`}
                  />
                  <span>
                    {markedForReview[currentIndex] ? 'Marked for Review' : 'Mark for Review'}
                  </span>
                </button>
              </div>

              {/* Question Statement */}
              <div className="prose prose-stone max-w-none">
                <p className="text-base sm:text-lg font-serif font-semibold text-stone-900 leading-relaxed">
                  {language === 'en' ? currentQ.questionEn : currentQ.questionHi}
                </p>

                {/* Sub-statements if present */}
                {((language === 'en' ? currentQ.statementsEn : currentQ.statementsHi) || [])
                  .length > 0 && (
                  <div className="mt-4 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {(language === 'en' ? currentQ.statementsEn : currentQ.statementsHi)?.map(
                      (st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-sm text-stone-800">
                          <span className="font-semibold text-stone-600">{sIdx + 1}.</span>
                          <span className="leading-snug">{st}</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="mt-6 space-y-3">
                {(language === 'en' ? currentQ.optionsEn : currentQ.optionsHi).map(
                  (optText, oIdx) => {
                    const isSelected = selectedAnswers[currentIndex] === oIdx;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-500 text-stone-900 shadow-sm ring-1 ring-amber-500'
                            : 'bg-white hover:bg-stone-50/80 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-amber-600 text-stone-950'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-medium leading-relaxed pt-0.5">
                          {optText}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleClearResponse}
                disabled={selectedAnswers[currentIndex] === undefined}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Clear Response
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  disabled={currentIndex === questions.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar (1 col) */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900 mb-3">
                Question Palette
              </h3>

              {/* Status Summary Pill Strip */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-500">
                  <div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300" />
                  <span>Unanswered ({unattemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Review ({markedCount})</span>
                </div>
              </div>

              {/* Question Number Badges Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
                {questions.map((_, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isReview = !!markedForReview[idx];

                  let bgClass = 'bg-stone-100 text-stone-700 border-stone-200';
                  if (isReview) {
                    bgClass = 'bg-amber-500 text-stone-950 font-bold border-amber-600';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-600 text-white font-bold border-emerald-700';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center border transition-all cursor-pointer ${bgClass} ${
                        isCurrent ? 'ring-2 ring-stone-950 ring-offset-2' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-stone-100">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs transition-all shadow cursor-pointer text-center"
              >
                Submit Prelims Test
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Evaluation & Result Review Screen */
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-8">
          {/* Scorecard Hero Banner */}
          <div className="bg-gradient-to-br from-white via-amber-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Performance Evaluation Complete
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-2">
                  {quiz.title} Scorecard
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluated using standard UPSC negative marking rubric (-0.66 per wrong answer).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePersistResults}
                  disabled={hasSavedAttempt || savingAttempt}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  {savingAttempt ? (
                    'Saving...'
                  ) : hasSavedAttempt ? (
                    <>
                      <Check className="w-4 h-4" />
                      Recorded in Cloud Log
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      Save to My Profile
                    </>
                  )}
                </button>
                <button
                  onClick={onExit}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Back to Hub
                </button>
              </div>
            </div>

            {/* 4 Score Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80">
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Final Score</div>
                <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
                  {evaluatedResults.score}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    / {evaluatedResults.maxMarks}
                  </span>
                </div>
              </div>
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Accuracy</div>
                <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                  {evaluatedResults.accuracy}%
                </div>
              </div>
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Correct / Incorrect</div>
                <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                  <span className="text-emerald-700">{evaluatedResults.correct}</span> /{' '}
                  <span className="text-rose-700">{evaluatedResults.incorrect}</span>
                </div>
              </div>
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Time Taken</div>
                <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                  {Math.floor(evaluatedResults.timeSpent / 60)}m {evaluatedResults.timeSpent % 60}s
                </div>
              </div>
            </div>
          </div>

          {/* Subject Wise Breakdown */}
          {evaluatedResults.subjectWise.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-4 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-amber-600" />
                Subject Sectional Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {evaluatedResults.subjectWise.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="font-semibold text-xs text-stone-800">{s.subject}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
                      <span>Questions: {s.total}</span>
                      <span className="font-bold text-stone-900">{s.marks} pts</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-700 font-medium">{s.correct} correct</span>
                      <span>•</span>
                      <span className="text-rose-700 font-medium">{s.incorrect} wrong</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Comprehensive Question Solutions & Statutory Citations
            </h3>

            {questions.map((q, idx) => {
              const userChoice = selectedAnswers[idx];
              const isCorrect = userChoice === q.correctIndex;
              const isUnattempted = userChoice === undefined;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border p-5 sm:p-6 transition-all ${
                    isUnattempted
                      ? 'border-stone-200'
                      : isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-900 text-stone-100 text-xs font-serif font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-stone-600">{q.subject}</span>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs font-medium text-amber-800">{q.topic}</span>
                    </div>

                    <div>
                      {isUnattempted ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-600">
                          Unattempted
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Correct (+2.00)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Incorrect (-0.66)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="mt-3 text-sm sm:text-base font-serif font-semibold text-stone-900 leading-snug">
                    {language === 'en' ? q.questionEn : q.questionHi}
                  </p>

                  {/* Sub-statements */}
                  {((language === 'en' ? q.statementsEn : q.statementsHi) || []).length > 0 && (
                    <div className="mt-3 space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-800">
                      {(language === 'en' ? q.statementsEn : q.statementsHi)?.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2">
                          <span className="font-semibold text-stone-600">{sIdx + 1}.</span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Options review */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(language === 'en' ? q.optionsEn : q.optionsHi).map((opt, oIdx) => {
                      const isOptionCorrect = oIdx === q.correctIndex;
                      const isOptionChosen = oIdx === userChoice;
                      const letter = String.fromCharCode(65 + oIdx);

                      let style = 'bg-stone-50 border-stone-200 text-stone-700';
                      if (isOptionCorrect) {
                        style = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                      } else if (isOptionChosen && !isOptionCorrect) {
                        style = 'bg-rose-50 border-rose-300 text-rose-950 line-through';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center bg-white/80 border border-stone-300">
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isOptionCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700">
                              Correct Key
                            </span>
                          )}
                          {isOptionChosen && !isOptionCorrect && (
                            <span className="text-[10px] uppercase font-bold text-rose-700">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation */}
                  <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-stone-800">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Detailed UPSC Analytical Key:
                    </div>
                    <p className="leading-relaxed">
                      {language === 'en' ? q.explanationEn : q.explanationHi}
                    </p>
                    {q.sourceBook && (
                      <div className="mt-2 text-[11px] text-stone-500 font-medium">
                        Standard Citation: {q.sourceBook}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Confirm Prelims Submission
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to end this test session? Your responses will be finalized and
              evaluated against standard negative marking.
            </p>

            <div className="grid grid-cols-3 gap-2 my-5 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs">
              <div>
                <div className="font-bold text-emerald-700 text-base">{answeredCount}</div>
                <div className="text-stone-500 text-[11px]">Answered</div>
              </div>
              <div>
                <div className="font-bold text-stone-700 text-base">{unattemptedCount}</div>
                <div className="text-stone-500 text-[11px]">Unanswered</div>
              </div>
              <div>
                <div className="font-bold text-amber-700 text-base">{markedCount}</div>
                <div className="text-stone-500 text-[11px]">Review</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm & View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
