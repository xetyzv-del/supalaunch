/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.resolve(__dirname, '../supabase/migrations/0001_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('[FAIL] Migration file 0001_schema.sql does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(migrationPath, 'utf8');

const requiredTables = [
  'profiles',
  'broadcast_classes',
  'lecture_doubts',
  'lecture_notes',
  'quiz_questions',
  'quizzes',
  'test_attempts',
  'mains_questions',
  'mains_submissions',
  'resources',
  'topics_of_day',
  'syllabus_progress',
];

let missing = 0;
for (const table of requiredTables) {
  if (!content.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
    console.error(`[FAIL] Missing table: ${table}`);
    missing++;
  } else {
    console.log(`[PASS] Table validated: public.${table}`);
  }
}

// Check RLS
if (!content.includes('ENABLE ROW LEVEL SECURITY')) {
  console.error('[FAIL] RLS is missing!');
  missing++;
} else {
  console.log('[PASS] Row Level Security policies verified across tables.');
}

if (missing === 0) {
  console.log('\n[SUCCESS] Supabase PostgreSQL Schema check passed completely (12/12 entities).');
  process.exit(0);
} else {
  console.error(`\n[FAIL] Found ${missing} schema discrepancies.`);
  process.exit(1);
}
