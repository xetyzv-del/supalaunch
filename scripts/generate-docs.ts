/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docPath = path.resolve(__dirname, '../docs/DATA_MODEL.md');
const docsDir = path.dirname(docPath);

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const docContent = `# CivilEdge IAS — Architecture & Data Model Documentation

## System Overview
The production application uses Supabase Auth, PostgreSQL, Row-Level Security (RLS), private Storage buckets, and Realtime. Demo authentication and seeded production records are disabled. Local seed data is retained only for tests and is excluded from the browser bundle.

## Relational Schema & RLS Matrix

| Entity | Table | Access policy | Description |
|---|---|---|---|
| User Profile | \`profiles\` | Self read/update; staff read; role changes via staff RPC | Aspirant settings and study totals |
| Broadcast Class | \`broadcast_classes\` | Authenticated read; staff write | Live classes and schedules |
| Lecture Doubt | \`lecture_doubts\` | Authenticated read; owner insert; staff moderation | Live classroom questions |
| Doubt Upvote | \`doubt_upvotes\` | Authenticated read; owner writes own vote | Per-user lecture question votes |
| Lecture Note | \`lecture_notes\` | Owner only | Timestamped study notes |
| Quiz | \`quizzes\` | Published quizzes; staff manage | Prelims tests and drills |
| Quiz Question | \`quiz_questions\` | Authenticated published quiz access; staff manage | Bilingual question bank |
| Quiz Link | \`quiz_question_links\` | Published quizzes; staff manage | Ordered quiz-question relation |
| Test Attempt | \`test_attempts\` | Owner only | Student scorecards and diagnostics |
| Mains Question | \`mains_questions\` | Authenticated read; staff manage | Answer-writing prompts |
| Mains Submission | \`mains_submissions\` | Owner read/insert; server evaluates and updates | Student answers and persisted AI result |
| Resource | \`resources\` | Authenticated approved content; staff manage | Academic materials |
| Topic of Day | \`topics_of_day\` | Authenticated read; staff manage | Curated editorial content |
| Syllabus Paper | \`syllabus_papers\` | Authenticated read; staff manage | Syllabus sections |
| Syllabus Subtopic | \`syllabus_subtopics\` | Authenticated read; staff manage | Ordered syllabus topics |
| Syllabus Progress | \`syllabus_progress\` | Owner only | Per-user completion state |
| Admin Audit | \`admin_audit_log\` | Staff read; server-side writes | Administrative role-change record |

## Storage and Privileged Operations
Storage buckets are private. Authenticated reads and owner/staff upload policies apply to resources, briefs, handouts, and avatars. Staff roles are stored in \`profiles.role\`; user metadata and email naming do not grant privileges. Provision the first staff user through the trusted Supabase SQL editor. Mains evaluation verifies the Supabase session and submission owner, then persists results using a server-only service-role key.
`;

fs.writeFileSync(docPath, docContent, 'utf8');
console.log(`[OK] Generated documentation at ${docPath}`);
