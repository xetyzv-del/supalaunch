import type { DataRepo } from './repo';
import { supabaseRepo } from './supabaseRepo';

export type { DataRepo } from './repo';

export function getRepo(): DataRepo {
  return supabaseRepo;
}
