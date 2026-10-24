import { GS_BADGES, type GSBadge } from '../types';
import type { NewQuizQuestion } from './db/repo';

export const QUIZ_CSV_HEADER =
  '# Question | Statement1;Statement2 (optional) | OptionA | OptionB | OptionC | OptionD | CorrectIdx (0-3) | Explanation | Subject | Paper';

export const QUIZ_CSV_SAMPLE = `${QUIZ_CSV_HEADER}
With reference to Article 356 (President's Rule), consider the following: | A proclamation must be approved by both Houses within two months;It can be extended for a maximum of 3 years with periodic approvals | 1 only | 2 only | Both 1 and 2 | Neither 1 nor 2 | 2 | Both statements are correct under Article 356 as amended by the 44th Amendment Act 1978. | Indian Polity | GS-2`;

export const samplePipeDelimitedCsv = QUIZ_CSV_SAMPLE;

export interface QuizCsvResult {
  questions: NewQuizQuestion[];
  errors: string[];
  valid?: boolean;
}

export function parsePipeDelimitedQuizCsv(raw: string, _paper?: GSBadge, _subject?: string): QuizCsvResult {
  const res = parseQuizCsv(raw);
  return {
    ...res,
    valid: res.errors.length === 0,
  };
}

export function parseQuizCsv(raw: string): QuizCsvResult {
  const questions: NewQuizQuestion[] = [];
  const errors: string[] = [];

  raw.split(/\r?\n/).forEach((original, i) => {
    const line = original.trim();
    if (!line || line.startsWith('#')) return;
    const n = i + 1;
    const p = line.split('|').map((x) => x.trim());
    if (p.length < 9) {
      errors.push(`Line ${n}: expected at least 9 columns separated by "|", found ${p.length}.`);
      return;
    }
    const [q, stmts, a, b, c, d, idxRaw, exp, subject, paperRaw] = p;
    const options = [a, b, c, d];
    const idx = Number(idxRaw);
    const paper = (paperRaw || 'GS-2') as GSBadge;

    if (!q) return void errors.push(`Line ${n}: question text is empty.`);
    if (options.some((o) => !o)) return void errors.push(`Line ${n}: all four options are required.`);
    if (new Set(options.map((o) => o.toLowerCase())).size < 4) {
      return void errors.push(`Line ${n}: options must be distinct.`);
    }
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
      return void errors.push(`Line ${n}: CorrectIdx must be 0, 1, 2 or 3 (got "${idxRaw}").`);
    }
    if (!GS_BADGES.includes(paper)) {
      return void errors.push(`Line ${n}: Paper must be one of ${GS_BADGES.join(', ')} (got "${paperRaw}").`);
    }

    const statements = stmts ? stmts.split(';').map((s) => s.trim()).filter(Boolean) : [];
    questions.push({
      subject: subject || 'General Studies',
      topic: '',
      gsPaper: paper,
      questionEn: q,
      questionHi: q,
      statementsEn: statements.length ? statements : undefined,
      statementsHi: statements.length ? statements : undefined,
      optionsEn: options,
      optionsHi: options,
      correctIndex: idx,
      explanationEn: exp,
      explanationHi: exp,
      sourceBook: 'CivilEdge Faculty Bank',
    });
  });

  return { questions, errors };
}
