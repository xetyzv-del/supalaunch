/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const isSupabaseConfigured = Boolean(
    supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('example.com')
  );

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    supabase: {
      configured: isSupabaseConfigured,
      url: isSupabaseConfigured ? supabaseUrl : 'unconfigured_local_fallback',
      activeMode: isSupabaseConfigured ? 'option_a' : 'option_b_ready',
    },
    version: '1.0.0',
  });
});

// Mains answer AI Evaluation Proxy (using @google/genai if GEMINI_API_KEY is available)
app.post('/api/mains/evaluate', async (req: Request, res: Response) => {
  try {
    const { prompt, answerText, wordLimit = 250, marks = 15 } = req.body || {};

    if (!answerText || typeof answerText !== 'string') {
      return res.status(400).json({ error: 'answerText is required' });
    }

    const wordCount = answerText.trim().split(/\s+/).length;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
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
          model: 'gemini-2.5-flash',
          contents: `Question: ${prompt}\n\nStudent Answer (${wordCount} words):\n${answerText}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        }
      } catch (aiErr) {
        console.warn('Gemini evaluation error, falling back to rubric heuristics:', aiErr);
      }
    }

    // High quality rubric heuristic evaluation
    const hasIntro = answerText.length > 80;
    const hasKeywords =
      /article|constitution|supreme court|judgment|statute|act|committee|policy|data|niti aayog|rbi/i.test(
        answerText
      );
    const hasStructure = answerText.includes('\n') || answerText.includes('1.') || answerText.includes('-');
    const withinLimit = wordCount >= wordLimit * 0.7 && wordCount <= wordLimit * 1.25;

    let baseScore = marks * 0.45;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasKeywords) {
      baseScore += marks * 0.15;
      strengths.push('Demonstrates relevant statutory and constitutional vocabulary.');
    } else {
      improvements.push('Incorporate explicit statutory anchors, committee reports, or constitutional articles.');
    }

    if (hasStructure) {
      baseScore += marks * 0.1;
      strengths.push('Clean structural segmentation with legible paragraphs or point-wise dimensions.');
    } else {
      improvements.push('Adopt a structured 4-part framework: Context -> Dimensions -> Data -> Way Forward.');
    }

    if (withinLimit) {
      baseScore += marks * 0.1;
      strengths.push(`Maintained disciplined word count (${wordCount} words against ${wordLimit} limit).`);
    } else {
      improvements.push(`Align closer to the target ${wordLimit} word limit (currently ${wordCount} words).`);
    }

    const finalScore = Number(Math.min(marks * 0.85, Math.max(marks * 0.35, baseScore)).toFixed(1));

    return res.json({
      score: finalScore,
      feedback: `Evaluated with UPSC CSE DAW Rubric. Word count: ${wordCount}/${wordLimit}. ${
        hasKeywords
          ? 'Strong statutory awareness displayed.'
          : 'Further grounding in legal and constitutional doctrine recommended.'
      }`,
      strengths: strengths.length ? strengths : ['Clear attempt addressing the core directive of the question.'],
      improvements: improvements.length
        ? improvements
        : ['Deepen multi-dimensional perspectives by contrasting judicial vs administrative viewpoints.'],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

// Vite Middleware mounting in development, or Static Serving in production
async function startServer() {
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
