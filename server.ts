/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
const supabaseConnectSources = ["'self'"];
try {
  const projectUrl = new URL(supabaseUrl || process.env.VITE_SUPABASE_URL || '');
  supabaseConnectSources.push(projectUrl.origin, `wss://${projectUrl.host}`);
} catch {
  // Supabase is optional during local development.
}

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 0);
app.use(helmet({
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'connect-src': supabaseConnectSources,
          'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
          'frame-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        },
      }
    : false,
}));
app.use(express.json({ limit: '1mb' }));

const mainsEvaluationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    supabaseConfigured: Boolean(supabaseAdmin),
    aiEvaluationConfigured: Boolean(process.env.GEMINI_API_KEY),
    version: '1.0.0',
  });
});

app.post('/api/mains/evaluate', mainsEvaluationLimiter, async (req: Request, res: Response) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Mains evaluation is not configured.' });
    }

    const authorization = req.header('authorization') ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) return res.status(401).json({ error: 'Invalid session.' });

    const { submissionId, answerText } = req.body || {};
    if (
      typeof submissionId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId) ||
      typeof answerText !== 'string' ||
      !answerText.trim() ||
      answerText.length > 15000
    ) {
      return res.status(400).json({ error: 'Invalid submission request.' });
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('mains_submissions')
      .select('id, user_id, question_id, question_prompt, max_marks')
      .eq('id', submissionId)
      .eq('user_id', authData.user.id)
      .single();
    if (submissionError || !submission) return res.status(404).json({ error: 'Submission not found.' });

    const { data: question, error: questionError } = await supabaseAdmin
      .from('mains_questions')
      .select('word_limit')
      .eq('id', submission.question_id)
      .single();
    if (questionError || !question) return res.status(404).json({ error: 'Question not found.' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Mains evaluation is not configured.' });

    const trimmedAnswer = answerText.trim();
    const wordCount = trimmedAnswer.split(/\s+/).length;
    const wordLimit = Number(question.word_limit);
    const marks = Number(submission.max_marks);

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are a senior UPSC Civil Services Mains answer copy evaluator.
Evaluate this answer according to strict UPSC standards:
1. Relevancy to question directives (Discuss, Critically Examine, Evaluate).
2. Multi-dimensional analysis (Constitutional, Statutory, Socio-economic, Administrative).
3. Statutory/Constitutional references, Supreme Court rulings, and empirical data.
4. Balanced, progressive Way Forward and Conclusion.
Score out of ${marks}.
Return a structured JSON with:
{
  "score": number (e.g. 7.5 or 10),
  "feedback": "summary feedback paragraph",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: `Question: ${submission.question_prompt}\n\nStudent Answer (${wordCount} words):\n${trimmedAnswer}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}') as {
      score?: unknown;
      feedback?: unknown;
      strengths?: unknown;
      improvements?: unknown;
    };
    const score = Number(parsed.score);
    if (
      !Number.isFinite(score) || score < 0 || score > marks ||
      typeof parsed.feedback !== 'string' || !parsed.feedback.trim()
    ) {
      return res.status(502).json({ error: 'Evaluation provider returned an invalid result.' });
    }

    const evaluation = {
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.filter((item): item is string => typeof item === 'string').slice(0, 8)
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.filter((item): item is string => typeof item === 'string').slice(0, 8)
        : [],
    };
    const feedback = parsed.feedback.trim().slice(0, 5000);
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('mains_submissions')
      .update({
        answer_text: trimmedAnswer,
        word_count: wordCount,
        status: 'evaluated',
        score,
        feedback,
        evaluation,
      })
      .eq('id', submissionId)
      .eq('user_id', authData.user.id)
      .select('*')
      .single();

    if (updateError || !updated) return res.status(500).json({ error: 'Unable to save evaluation.' });
    return res.json({ submission: updated });
  } catch {
    return res.status(500).json({ error: 'Evaluation failed. Please try again later.' });
  }
});

// Vite Middleware mounting in development, or Static Serving in production
async function startServer() {
  const publicSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (isProduction && (!process.env.VITE_SUPABASE_URL || !publicSupabaseKey)) {
    throw new Error('Production requires VITE_SUPABASE_URL and a Supabase anon or publishable key.');
  }

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CivilEdge IAS] Server listening on http://0.0.0.0:${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
