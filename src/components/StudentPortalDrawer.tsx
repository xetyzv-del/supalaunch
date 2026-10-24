/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  Target,
  BookOpen,
  Cloud,
  HardDrive,
  Shield,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Sparkles,
  Settings,
  User,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { UserProfileData, TargetYear } from '../types/index.ts';
import { Avatar } from './Avatar.tsx';

interface StudentPortalDrawerProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onUpdateProfile: (patch: Partial<UserProfileData>) => Promise<void>;
  onLogMinutes?: (mins: number) => Promise<void>;
  onLogStudyMinutes?: (mins: number) => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenAdminStudio?: () => void;
}

export const StudentPortalDrawer: React.FC<StudentPortalDrawerProps> = ({
  open,
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onLogMinutes,
  onLogStudyMinutes,
  onSignOut,
  onOpenAdminStudio,
}) => {
  const visible = open ?? isOpen ?? false;
  const [targetYear, setTargetYear] = useState<TargetYear>(profile.targetYear || '2026');
  const [optionalSubject, setOptionalSubject] = useState(
    profile.optionalSubject || 'Public Administration'
  );
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!visible) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({
        targetYear,
        optionalSubject,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickLog = async (mins: number) => {
    setIsLoggingTime(true);
    try {
      if (onLogMinutes) {
        await onLogMinutes(mins);
      } else if (onLogStudyMinutes) {
        await onLogStudyMinutes(mins);
      }
    } finally {
      setIsLoggingTime(false);
    }
  };

  const optionals = [
    'Public Administration',
    'Political Science & IR (PSIR)',
    'Geography',
    'Sociology',
    'History',
    'Anthropology',
    'Philosophy',
    'Economics',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-white via-slate-50/80 to-white text-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 overflow-y-auto font-sans">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/40 via-white to-slate-50/70">
          <div className="flex items-center gap-3">
            <Avatar name={profile.displayName} photoUrl={profile.photoURL} size="lg" />
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900">
                {profile.displayName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{profile.email}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* Status & Administration Card */}
          {profile.role === 'admin' || profile.role === 'mentor' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-slate-50 border border-amber-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Academy Faculty &amp; Admin Suite
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Director Access
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Full administrative authority over Live Seminars, Daily Crux editorials, Prelims MCQ banks, Mains grading, and the academic document vault.
              </p>

              {onOpenAdminStudio && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminStudio();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>Open Academy Admin Dashboard</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Aspirant Cohort Status
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Enrollment
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                UPSC Civil Services Examination 2026–27 cohort. All lecture notes, study minutes, and answer writing evaluations are synchronized across your devices.
              </p>
            </div>
          )}

          {/* Daily Study Streak & Goal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Daily Streak</span>
              </div>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                {profile.streakDays}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">days</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Study Logged</span>
              </div>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                {Math.floor(profile.studyMinutes / 60)}h {profile.studyMinutes % 60}m
              </div>
            </div>
          </div>

          {/* Quick Study Logger */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quick Log Study Session
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleQuickLog(mins)}
                  disabled={isLoggingTime}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-amber-100 active:bg-amber-500 active:text-slate-950 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  +{mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* Aspirant Target Profile Form */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              <span>Target Parameters</span>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-medium">Target UPSC CSE Year</label>
              <div className="grid grid-cols-3 gap-2">
                {(['2026', '2027', '2028'] as TargetYear[]).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTargetYear(yr)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetYear === yr
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    CSE {yr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1.5 font-medium">Optional Subject</label>
              <select
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {optionals.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isSaving ? (
                'Saving...'
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" />
                  <span>Profile Saved</span>
                </>
              ) : (
                'Save Aspirant Parameters'
              )}
            </button>
          </div>

          {/* Admin Studio Trigger if role is admin or mentor */}
          {profile.role === 'admin' && onOpenAdminStudio && (
            <button
              onClick={() => {
                onClose();
                onOpenAdminStudio();
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-sm shadow-md flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Launch Faculty &amp; Admin Studio</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onSignOut}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
