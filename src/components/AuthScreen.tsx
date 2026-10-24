import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Mail } from 'lucide-react';

type AuthTab = 'signin' | 'signup' | 'magic' | 'reset';

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  onMagicLink: (email: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
  isSupabaseConfigured: boolean;
}

export function AuthScreen({
  onSignIn,
  onSignUp,
  onMagicLink,
  onGoogleSignIn,
  onPasswordReset,
  isSupabaseConfigured,
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
    <main className="min-h-screen bg-[#f4f5f2] text-slate-900 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden min-h-screen flex-col justify-between bg-[#173f39] px-12 py-10 text-white lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-amber-400 font-serif text-sm font-bold text-slate-950">CE</span>
          <span className="font-serif text-lg font-semibold">CivilEdge <span className="text-amber-300">IAS</span></span>
        </div>
        <div className="max-w-md pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Aspirant &amp; faculty workspace</p>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight xl:text-5xl">Your preparation, in one place.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/80">
            Sign in to continue with your classes, study plan, assessments, and saved work.
          </p>
        </div>
        <p className="text-xs text-emerald-100/70">CivilEdge IAS · Secure account access</p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] space-y-7">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#173f39] font-serif text-xs font-bold text-amber-300">CE</span>
            <span className="font-serif text-lg font-semibold">CivilEdge <span className="text-amber-700">IAS</span></span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Account access</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-normal text-slate-950">
              {tab === 'signin' ? 'Sign in' : tab === 'signup' ? 'Create your account' : tab === 'magic' ? 'Email sign-in link' : 'Reset password'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use your CivilEdge IAS account to continue.</p>
          </div>

          {!isSupabaseConfigured ? (
            <div role="status" className="border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
              Sign-in is unavailable. Supabase project configuration is required.
            </div>
          ) : null}

          <div className="flex items-center gap-1 border-b border-slate-200">
            {(
              [
                { id: 'signin', label: 'Sign In' },
                { id: 'signup', label: 'Register' },
                { id: 'magic', label: 'Email Link' },
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
                className={`flex-1 border-b-2 px-2 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                  tab === t.id ? 'border-amber-600 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error ? (
            <div role="alert" className="border-l-2 border-rose-600 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-800">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div role="status" className="flex items-start gap-2 border-l-2 border-emerald-700 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            {tab === 'signup' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Full name"
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
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {tab === 'signin' || tab === 'signup' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">Password</label>
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
                    id="auth-password"
                    required
                    minLength={6}
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || !isSupabaseConfigured}
              className="w-full rounded-md bg-[#173f39] py-3 text-sm font-semibold text-white hover:bg-[#21584f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              {busy
                    ? 'Please wait…'
                : tab === 'signin'
                    ? 'Sign in'
                : tab === 'signup'
                    ? 'Create account'
                : tab === 'magic'
                    ? 'Send sign-in link'
                    : 'Send reset link'}
            </button>
          </form>

                  <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#f4f5f2] px-3 text-xs text-slate-500">Or use</span>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || !isSupabaseConfigured}
            onClick={async () => {
              setError(null);
              try {
                await onGoogleSignIn();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Google OAuth failed.');
              }
            }}
            className="w-full rounded-md border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
          >
            Continue with Google
          </button>

        </div>
      </section>
    </main>
  );
}
