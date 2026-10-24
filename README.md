# CivilEdge IAS — UPSC Civil Services Academic Platform

CivilEdge IAS is a production-grade UPSC CSE preparation platform architected with dual backend support:
1. **Option A: Supabase Cloud Connected Mode** — Complete cloud PostgreSQL database (12 relational entities), Supabase Auth sessions, Row-Level Security (RLS) policies, Cloud Storage for signed PDF handouts, and Realtime WebSocket notifications for live classroom Q&A.
2. **Option B: Offline Local Sandbox Mode** — Zero-external-dependency local storage engine with cross-tab `BroadcastChannel` synchronization, designed for offline aspirants and rapid testing.

---

## 🚀 Live Preview: Option A & Option B

You can toggle between **Option A** and **Option B** at any moment in the application:

### 1. In the Workspace Sub-Toolbar
Directly below the top header, an interactive architecture switcher is available:
- **`[ ☁ Option A: Supabase Cloud ]`**: Activates Supabase Cloud mode with real-time session tracking, PostgreSQL storage, and authenticated cloud features.
- **`[ 📦 Option B: Sandbox ]`**: Activates the local sandbox mode for instant offline drills.

### 2. On the Authentication Screen
When in Option A without an existing Supabase session, the Auth Screen provides **1-Click Quick Cloud Previews**:
- **`[ Preview as Cloud Aspirant ]`** — Launches as Kavya Sundaram (2026 Aspirant profile).
- **`[ Preview as Cloud Faculty/Admin ]`** — Launches as Dr. Anurag Verma with full administrative access to the CSV Prelims Importer, Daily Crux Publisher, and Supabase RLS Matrix.
- Standard authentication methods: Email & Password, One-Click Magic Link, and Google OAuth.

### 3. In the Aspirant Portal Drawer
Click the student avatar in the top right to open the Aspirant Portal and toggle between Option A and Option B or customize your optional subject (PSIR, Public Administration, Geography, etc.) and target year (2026/2027/2028).

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
- Instant rubric evaluation powered by Gemini AI (with heuristic fallback) scoring answers on multidimensionality, constitutional vocabulary, and structure.

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

# Run test suite (8 passing unit tests)
npm test

# Check TypeScript typing and linting
npm run lint

# Generate Supabase SQL seed from canonical UPSC data
npm run seed:generate

# Verify database schema integrity
npm run schema:check

# Generate data model documentation
npm run docs:model

# Compile production Vite bundle
npm run build
```
