import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';

type AuthTab = 'signin' | 'signup' | 'magic' | 'reset';

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  onMagicLink: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
}

export function AuthScreen({
  onSignIn,
  onSignUp,
  onMagicLink,
  onGoogleSignIn,
  onPasswordReset,
}: AuthScreenProps) {
  const [tab, setTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (tab === 'signin') {
        await onSignIn(email, password);
      } else if (tab === 'signup') {
        const res = await onSignUp(email, password, fullName);
        if (res.needsConfirmation) {
          setNotice('Verification link sent to your email. Confirm to activate your CivilEdge account.');
        }
      } else if (tab === 'magic') {
        await onMagicLink(email);
        setNotice('One-click sign-in link dispatched to your inbox.');
      } else {
        await onPasswordReset(email);
        setNotice('Password recovery instructions sent to your email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Editorial Brief Column */}
      <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              CivilEdge <span className="text-amber-600">IAS</span>
            </span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase text-amber-900">
              UPSC CSE 2026–27
            </span>
          </div>

          <p className="mt-8 text-xs uppercase tracking-widest text-amber-700 font-semibold">
            Official Aspirant &amp; Faculty Portal
          </p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Disciplined preparation for Prelims, Mains &amp; Live Faculty Seminars.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            Synchronize your micro-syllabus completion, bilingual Prelims accuracy (+2 / -0.66), rubric-scored Mains answers, and timestamped lecture notes across all your devices.
          </p>

          <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Bilingual Prelims Engine
              </dt>
              <dd className="mt-1 text-slate-600 text-xs leading-relaxed">
                English &amp; Hindi statement-based MCQs with live percentile rank and subject-wise negative marking diagnostics.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Secure Academic Records
              </dt>
              <dd className="mt-1 text-slate-600 text-xs leading-relaxed">
                Every lecture note, study streak log, and Mains evaluation copy is isolated and encrypted to your account.
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>GS-1 to GS-4 · CSAT · Essay · Optional</span>
          <span className="text-slate-600 font-medium">CivilEdge IAS Academy · Pan-India Online Digital Learning</span>
        </div>
      </div>

      {/* Authentication Form Column */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200">
            {(
              [
                { id: 'signin', label: 'Sign In' },
                { id: 'signup', label: 'Create Account' },
                { id: 'magic', label: 'Magic Link' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors cursor-pointer ${
                  tab === t.id ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Rao"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {tab === 'signin' || tab === 'signup' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  {tab === 'signin' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('reset');
                        setError(null);
                        setNotice(null);
                      }}
                      className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {busy
                ? 'Authenticating…'
                : tab === 'signin'
                ? 'Sign In to CivilEdge IAS'
                : tab === 'signup'
                ? 'Create CivilEdge Account'
                : tab === 'magic'
                ? 'Send One-Click Magic Link'
                : 'Send Password Reset Link'}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError(null);
              try {
                await onGoogleSignIn();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Google OAuth failed.');
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            Continue with Google OAuth
          </button>
        </div>
      </div>
    </div>
  );
}
