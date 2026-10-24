import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'aspirant' | 'mentor' | 'admin';
}

export interface UseAuthResult {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function mapSupabaseUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (u.email ? u.email.split('@')[0] : 'Aspirant');
  const avatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    undefined;

  return {
    id: u.id,
    email: u.email ?? '',
    displayName: name,
    photoURL: avatar,
    role: undefined,
  };
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [cloudUser, setCloudUser] = useState<AuthUser | null>(null);
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
        setCloudUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message);
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string, fullName: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
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
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase && session) {
      await supabase.auth.signOut();
    }
    setCloudUser(null);
  }, [session]);

  return {
    user: cloudUser,
    session,
    loading,
    signInWithPassword,
    signUpWithPassword,
    sendMagicLink,
    signInWithGoogle,
    sendPasswordReset,
    signOut,
  };
}
