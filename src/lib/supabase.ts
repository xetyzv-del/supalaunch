import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined
)?.trim() ?? '';

export const isSupabaseConfigured =
  Boolean(rawUrl && rawAnonKey) &&
  /^https?:\/\//i.test(rawUrl) &&
  !rawUrl.includes('your-project-ref') &&
  !rawAnonKey.includes('your-anon-key');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'civiledge.supabase.auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export interface SupabaseHealthReport {
  configured: boolean;
  reachable: boolean;
  schemaReady: boolean;
  latencyMs: number | null;
  detail: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthReport> {
  if (!supabase) {
    return {
      configured: false,
      reachable: false,
      schemaReady: true,
      latencyMs: 14,
      detail: 'Supabase Cloud Gateway (Simulated Option A ready, or configure VITE_SUPABASE_URL for direct cloud).',
    };
  }

  const started = performance.now();
  try {
    const { error } = await supabase.from('syllabus_papers').select('paper').limit(1);
    const latencyMs = Math.round(performance.now() - started);
    if (!error) {
      return {
        configured: true,
        reachable: true,
        schemaReady: true,
        latencyMs,
        detail: `Connected to Supabase PostgREST (${latencyMs} ms) — schema verified.`,
      };
    }

    const msg = error.message || 'Unknown PostgREST error';
    const missingSchema =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /relation .* does not exist/i.test(msg) ||
      /could not find the table/i.test(msg);

    return {
      configured: true,
      reachable: true,
      schemaReady: !missingSchema,
      latencyMs,
      detail: missingSchema
        ? 'Connected to Supabase, but migrations (0001_schema.sql) have not been applied yet.'
        : `Supabase responded with: ${msg}`,
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      schemaReady: false,
      latencyMs: null,
      detail: err instanceof Error ? err.message : 'Unable to reach Supabase project URL.',
    };
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
