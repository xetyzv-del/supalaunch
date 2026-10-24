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

## 1. System Overview
CivilEdge IAS is an institutional-grade UPSC Civil Services Examination preparation application with dual-mode architecture:
- **Option A (Supabase Cloud Connected)**: Full cloud sync with PostgreSQL 15, Supabase Auth (Email/Password, Magic Link, Google OAuth), Row Level Security, Cloud Storage for handouts/PDFs, and Realtime WebSocket updates for live doubt queries.
- **Option B (Offline Local Sandbox)**: Instant zero-latency offline environment using browser local storage with cross-tab BroadcastChannel sync for offline aspirants.

## 2. Relational Schema & RLS Matrix

| Entity | Table | RLS Policy | Realtime | Description |
|---|---|---|---|---|
| User Profile | \`profiles\` | Public Read / Self Update | Yes | Aspirant target parameters, streaks & study minutes |
| Broadcast Class | \`broadcast_classes\` | Public Read / Faculty Write | Yes | Studio Seminars (YouTube, Zoom, Google Meet, Vimeo) |
| Lecture Doubt | \`lecture_doubts\` | Public Read / User Insert | Yes | Live lecture Q&A with upvoting |
| Lecture Note | \`lecture_notes\` | Private to Owner | No | Timestamped study notes during classes |
| Quiz Question | \`quiz_questions\` | Public Read / Admin Write | No | Bilingual (+2.0 / -0.66) prelims questions |
| Quiz | \`quizzes\` | Public Read / Admin Write | No | Prelims Full Mocks and Topic Quizzes |
| Test Attempt | \`test_attempts\` | Private to Owner | No | Scorecards, percentile rank & diagnostic breakdowns |
| Mains Question | \`mains_questions\` | Public Read / Admin Write | No | Daily Answer Writing (10/15 marker) questions |
| Mains Submission | \`mains_submissions\` | Private to Owner | No | Aspirant submissions with AI/Rubric evaluation |
| Resource Compendium | \`resources\` | Approved Public Read | Yes | NCERT, standard books & PIB summaries |
| Topic of the Day | \`topics_of_day\` | Public Read | No | Curated editorial crux & statutory anchor matrix |
| Micro-Syllabus | \`syllabus_progress\` | Private to Owner | No | Granular topic coverage across GS-1 through GS-4 |

## 3. Option A vs Option B Mode Switching
Users can switch between Option A and Option B seamlessly:
1. In the top sub-toolbar: 1-click switcher toggles live cloud and offline sandbox.
2. In the Aspirant Portal drawer: Backend architecture selector.
3. On the Auth Screen: 1-click cloud preview as Aspirant or Faculty/Admin without requiring pre-existing Supabase credentials.
`;

fs.writeFileSync(docPath, docContent, 'utf8');
console.log(`[OK] Generated documentation at ${docPath}`);
