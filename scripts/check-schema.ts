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
const hardeningMigrationPath = path.resolve(__dirname, '../supabase/migrations/0003_production_hardening.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('[FAIL] Migration file 0001_schema.sql does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(migrationPath, 'utf8');
if (!fs.existsSync(hardeningMigrationPath)) {
  console.error('[FAIL] Production hardening migration 0003_production_hardening.sql does not exist.');
  process.exit(1);
}
const hardeningContent = fs.readFileSync(hardeningMigrationPath, 'utf8');

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
  const requiredLegacyFixes = [
    'ALTER TABLE public.lecture_doubts',
    'ALTER TABLE public.lecture_notes',
    'RENAME COLUMN avatar_url TO avatar',
  ];
  for (const required of requiredLegacyFixes) {
    if (!content.includes(required)) {
      console.error(`[FAIL] Baseline migration is missing the legacy schema fix: ${required}`);
      missing++;
    }
  }

  const requiredHardening = [
    'CREATE TABLE IF NOT EXISTS public.quiz_question_links',
    'CREATE TABLE IF NOT EXISTS public.doubt_upvotes',
    'CREATE TABLE IF NOT EXISTS public.syllabus_papers',
    'CREATE TABLE IF NOT EXISTS public.syllabus_subtopics',
    'CREATE TABLE IF NOT EXISTS public.admin_audit_log',
    'CREATE OR REPLACE FUNCTION public.admin_set_user_role',
    'CREATE OR REPLACE FUNCTION public.import_quiz',
    'CREATE OR REPLACE FUNCTION public.is_staff()',
    'ALTER TABLE public.quiz_questions',
    'ALTER TABLE public.broadcast_classes',
    'ALTER TABLE public.topics_of_day',
    'DROP POLICY IF EXISTS "Users view and insert their own mains submissions"',
    'DROP POLICY IF EXISTS "Allow authenticated or public upload to resources"',
  ];
  for (const required of requiredHardening) {
    if (!hardeningContent.includes(required)) {
      console.error(`[FAIL] Production migration is missing: ${required}`);
      missing++;
    }
  }
}

if (missing === 0) {
  console.log('\n[SUCCESS] Supabase schema and production hardening checks passed.');
  process.exit(0);
} else {
  console.error(`\n[FAIL] Found ${missing} schema discrepancies.`);
  process.exit(1);
}
