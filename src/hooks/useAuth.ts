import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const MODE_PREF_KEY = 'civiledge.active_mode.pref'; // 'option_a' | 'option_b'
const SIMULATED_CLOUD_SESSION_KEY = 'civiledge.simulated_cloud.user';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isSandbox: boolean;
  role?: 'aspirant' | 'mentor' | 'admin';
}

export interface UseAuthResult {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isCloudAuth: boolean;
  sandboxActive: boolean;
  activeMode: 'option_a' | 'option_b';
  activeModeLabel: string;
  setModeOptionA: () => void;
  setModeOptionB: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithDemoCloudUser: (role: 'aspirant' | 'admin') => void;
  enterSandboxMode: () => void;
  exitSandboxMode: () => void;
  signOut: () => Promise<void>;
}

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admitted = [
    'admin@civiledge.in',
    'director@civiledge.in',
    'faculty@civiledge.in',
    'kshitiz2007@gmail.com',
  ];
  if (admitted.includes(normalized)) return true;
  if (
    normalized.startsWith('admin@') ||
    normalized.startsWith('director@') ||
    normalized.startsWith('faculty@')
  ) {
    return true;
  }
  if (normalized.includes('admin') || normalized.includes('faculty')) return true;
  return false;
}

const SANDBOX_USER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'aspirant@civiledge.in',
  displayName: 'CivilEdge Aspirant',
  isSandbox: true,
  role: 'aspirant',
};

const DEMO_CLOUD_ASPIRANT: AuthUser = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'aspirant@civiledge.in',
  displayName: 'CivilEdge Aspirant',
  isSandbox: false,
  role: 'aspirant',
};

const DEMO_CLOUD_ADMIN: AuthUser = {
  id: 'a0000000-0000-4000-8000-000000000002',
  email: 'admin@civiledge.in',
  displayName: 'Faculty Director',
  isSandbox: false,
  role: 'admin',
};

function mapSupabaseUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const email = (u.email ?? '').toLowerCase();
  const isAdmin = isAdminEmail(email);
  const name =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (isAdmin ? 'Faculty Director' : u.email ? u.email.split('@')[0] : 'Aspirant');
  const avatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    undefined;

  return {
    id: u.id,
    email: u.email ?? '',
    displayName: name,
    photoURL: avatar,
    isSandbox: false,
    role: isAdmin ? 'admin' : undefined,
  };
}

function readStoredMode(): 'option_a' | 'option_b' {
  try {
    const val = localStorage.getItem(MODE_PREF_KEY);
    if (val === 'option_a' || val === 'option_b') return val;
  } catch {
    // ignore
  }
  return 'option_a';
}

function readSimulatedCloudUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SIMULATED_CLOUD_SESSION_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    // ignore
  }
  return null;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [cloudUser, setCloudUser] = useState<AuthUser | null>(() => readSimulatedCloudUser());
  const [activeMode, setActiveMode] = useState<'option_a' | 'option_b'>(() => readStoredMode());
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        if (data.session?.user) {
          setCloudUser(mapSupabaseUser(data.session.user));
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) {
        setCloudUser(mapSupabaseUser(nextSession.user));
      } else {
        setCloudUser(readSimulatedCloudUser());
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setModeOptionA = useCallback(() => {
    setActiveMode('option_a');
    try {
      localStorage.setItem(MODE_PREF_KEY, 'option_a');
    } catch {
      // ignore
    }
  }, []);

  const setModeOptionB = useCallback(() => {
    setActiveMode('option_b');
    try {
      localStorage.setItem(MODE_PREF_KEY, 'option_b');
    } catch {
      // ignore
    }
  }, []);

  const signInWithDemoCloudUser = useCallback((role: 'aspirant' | 'admin') => {
    const userToUse = role === 'admin' ? DEMO_CLOUD_ADMIN : DEMO_CLOUD_ASPIRANT;
    setCloudUser(userToUse);
    setActiveMode('option_a');
    try {
      localStorage.setItem(MODE_PREF_KEY, 'option_a');
      localStorage.setItem(SIMULATED_CLOUD_SESSION_KEY, JSON.stringify(userToUse));
    } catch {
      // ignore
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      return;
    }

    // Option A Simulated Cloud Sign-In
    const normalized = email.trim().toLowerCase();
    const isAdmin = isAdminEmail(normalized);
    const simulated: AuthUser = {
      id: `cloud-${Math.random().toString(36).slice(2, 10)}`,
      email: email.trim(),
      displayName: isAdmin ? 'Faculty Director' : email.split('@')[0],
      isSandbox: false,
      role: isAdmin ? 'admin' : 'aspirant',
    };
    setCloudUser(simulated);
    try {
      localStorage.setItem(SIMULATED_CLOUD_SESSION_KEY, JSON.stringify(simulated));
    } catch {
      // ignore
    }
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string, fullName: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() || email.split('@')[0] },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    }

    const normalized = email.trim().toLowerCase();
    const isAdmin = isAdminEmail(normalized);
    const simulated: AuthUser = {
      id: `cloud-${Math.random().toString(36).slice(2, 10)}`,
      email: email.trim(),
      displayName: fullName.trim() || (isAdmin ? 'Faculty Director' : email.split('@')[0]),
      isSandbox: false,
      role: isAdmin ? 'admin' : 'aspirant',
    };
    setCloudUser(simulated);
    try {
      localStorage.setItem(SIMULATED_CLOUD_SESSION_KEY, JSON.stringify(simulated));
    } catch {
      // ignore
    }
    return { needsConfirmation: false };
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw new Error(error.message);
      return;
    }
    // Option A preview: simulated one-click link activation
    const normalized = email.trim().toLowerCase();
    const isAdmin = isAdminEmail(normalized);
    const simulated: AuthUser = {
      id: `cloud-${Math.random().toString(36).slice(2, 10)}`,
      email: email.trim(),
      displayName: isAdmin ? 'Faculty Director' : email.split('@')[0],
      isSandbox: false,
      role: isAdmin ? 'admin' : 'aspirant',
    };
    setCloudUser(simulated);
    try {
      localStorage.setItem(SIMULATED_CLOUD_SESSION_KEY, JSON.stringify(simulated));
    } catch {
      // ignore
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw new Error(error.message);
      return;
    }
    const simulated: AuthUser = {
      id: 'g-cloud-001',
      email: 'aspirant.google@gmail.com',
      displayName: 'Google Aspirant (Cloud Auth)',
      isSandbox: false,
      role: 'aspirant',
    };
    setCloudUser(simulated);
    try {
      localStorage.setItem(SIMULATED_CLOUD_SESSION_KEY, JSON.stringify(simulated));
    } catch {
      // ignore
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw new Error(error.message);
    }
  }, []);

  const enterSandboxMode = useCallback(() => {
    setModeOptionB();
  }, [setModeOptionB]);

  const exitSandboxMode = useCallback(() => {
    setModeOptionA();
  }, [setModeOptionA]);

  const signOut = useCallback(async () => {
    if (supabase && session) {
      await supabase.auth.signOut();
    }
    setCloudUser(null);
    try {
      localStorage.removeItem(SIMULATED_CLOUD_SESSION_KEY);
    } catch {
      // ignore
    }
  }, [session]);

  const isOptionA = activeMode === 'option_a';
  const effectiveUser = isOptionA ? cloudUser : SANDBOX_USER;
  const isCloudAuth = isOptionA && Boolean(cloudUser);
  const sandboxActive = !isOptionA || !cloudUser;

  return {
    user: effectiveUser,
    session,
    loading,
    isCloudAuth,
    sandboxActive,
    activeMode,
    activeModeLabel: isOptionA ? 'Option A (Supabase Cloud)' : 'Option B (Offline Sandbox)',
    setModeOptionA,
    setModeOptionB,
    signInWithPassword,
    signUpWithPassword,
    sendMagicLink,
    signInWithGoogle,
    sendPasswordReset,
    signInWithDemoCloudUser,
    enterSandboxMode,
    exitSandboxMode,
    signOut,
  };
}
