# CivilEdge IAS — UPSC Civil Services Academic Platform

CivilEdge IAS uses Supabase Auth, PostgreSQL, Row-Level Security (RLS), Storage, and Realtime for application data. Demo sign-in and seeded production records are disabled. Local seed fixtures are retained only for unit tests.

## Supabase Configuration

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings. These values are included in the browser bundle; never put a service-role key or other secret in a `VITE_` variable.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the server environment. They are required to authenticate and persist Mains evaluations; never expose the service-role key to the browser.
3. Set `GEMINI_API_KEY` only in the server environment to enable AI evaluation. The route returns `503` when required server credentials are missing; it does not generate synthetic grades.
4. Apply the SQL files in `supabase/migrations/` to the project before building.
5. Configure Supabase Auth redirect URLs, email confirmation, OAuth providers, and production site URL in the Supabase dashboard.
6. Provision the first staff account by assigning its `profiles.role` through the trusted Supabase SQL editor. Do not grant staff roles through user metadata or email naming.
7. Set `TRUST_PROXY_HOPS` to the trusted proxy count for the hosting platform; leave it at `0` when serving directly.
8. Run `npm run schema:check`, `npm test`, `npm run lint`, and `npm run build` before deployment.

Vite embeds Supabase values at build time. Configure them in the deployment build environment and rebuild whenever they change. `.env` is ignored by Git; do not commit real credentials.

### Existing Supabase Projects

Apply migrations once, in order. Do not rerun `0001_schema.sql` against a project with existing tables; `CREATE TABLE IF NOT EXISTS` does not reconcile older column layouts. For `42703: column "user_id" does not exist`, run this read-only query and use the reported table to plan a data-preserving migration:

```sql
WITH required(table_name) AS (
	VALUES
		('lecture_doubts'),
		('lecture_notes'),
		('test_attempts'),
		('mains_submissions'),
		('syllabus_progress'),
		('doubt_upvotes')
)
SELECT required.table_name,
	CASE
		WHEN t.table_name IS NULL THEN 'table missing'
		WHEN c.column_name IS NULL THEN 'user_id missing'
		ELSE 'ok'
	END AS status
FROM required
LEFT JOIN information_schema.tables AS t
	ON t.table_schema = 'public' AND t.table_name = required.table_name
LEFT JOIN information_schema.columns AS c
	ON c.table_schema = 'public'
	AND c.table_name = required.table_name
	AND c.column_name = 'user_id'
ORDER BY required.table_name;
```

---

## 🏛 Core Academic Modules

### 1. Studio Classroom & Live Seminar Deck
- Multi-source live streaming: YouTube Live, Zoom, Google Meet, Vimeo, and custom HLS streams.
- Real-time timestamped study notes synchronized with lecture video markers.
- Live lecture doubt submission and upvoting with instant faculty reply cards.
- Integrated IST timetable filterable by status (`live`, `scheduled`, `completed`).

### 2. Prelims Bilingual Examination Engine
- Bilingual standard questions (English & Hindi) matching UPSC prelims pattern with assertion-reasoning, statements, and elimination pairs.
- Standard UPSC marking scheme: **+2.00 marks** for correct answers and **-0.66 marks** negative deduction.
- 10-MCQ Rapid Drills and Full Mock Tests with countdown timer, question palette navigator, and review flags.
- Comprehensive solutions with statutory citations (Constitution of India, Supreme Court judgments, Laxmikanth, NCERT, Economic Survey).

### 3. Mains Daily Answer Writing (DAW) Lab
- Timed practice desk with real-time word counter against strict UPSC limits (150 words for 10-markers, 250 words for 15-markers).
- Expandable 4-part structural framework blueprint: Introduction -> Analytical Dimensions -> Statutory/Data Anchors -> Way Forward.
- Authenticated rubric evaluation powered by Gemini AI, with results saved to the user's account.

### 4. Knowledge Compendium & Academic Resource Library
- Curated NCERT essentials, standard reference synopses (Polity, Modern History, Economy, Environment), monthly Yojana digests, and PIB bulletins.
- In-app document reader modal with markdown export.

### 5. Micro-Syllabus Tracker
- Micro-syllabus checklist across GS-1, GS-2, GS-3, GS-4, and CSAT.
- Categorized by historical question frequency: `High Priority`, `Frequent PYQs`, and `Core Standard`.
- Live visual progress rings and completion statistics.

### 6. Faculty & Admin Operations Suite
- **Pipe-Delimited CSV Test Importer**: Paste Prelims MCQs in single-line pipe format (`Question | Statements | OptA | OptB | OptC | OptD | CorrectIdx | Explanation | Subject | Paper`) with live syntax validation and 1-click batch import.
- **Daily Crux Publisher**: Publish editorial takeaways and statutory anchors directly to the student daily feed.
- **Supabase RLS & Schema Matrix**: Inspect table definitions, security policies, and PostgreSQL triggers.

---

## 🗄 Database Schema (Option A PostgreSQL)

Migrations are located in `supabase/migrations/`:
- `0001_schema.sql`: 12 relational tables with Row-Level Security (`profiles`, `broadcast_classes`, `lecture_doubts`, `lecture_notes`, `quiz_questions`, `quizzes`, `test_attempts`, `mains_questions`, `mains_submissions`, `resources`, `topics_of_day`, `syllabus_progress`).
- `0002_storage.sql`: Storage buckets (`handouts`, `resources`, `avatars`) and security policies.

---

## 🛠 Available Commands

```bash
# Start full-stack development server on port 3000
npm run dev

# Run test suite
npm test

# Check TypeScript typing and linting
npm run lint

# Verify database schema integrity
npm run schema:check

# Generate data model documentation
npm run docs:model

# Compile production Vite bundle
npm run build
```
