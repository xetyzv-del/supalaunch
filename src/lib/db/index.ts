import { localRepo } from './localRepo';
import type { DataRepo } from './repo';
import { supabaseRepo } from './supabaseRepo';

export type { DataRepo } from './repo';

export function getRepo(sandboxActive: boolean): DataRepo {
  if (sandboxActive) {
    return localRepo;
  }
  return supabaseRepo;
}
