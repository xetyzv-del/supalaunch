import { describe, it, expect } from 'vitest';
import { parseQuizCsv, parsePipeDelimitedQuizCsv, QUIZ_CSV_SAMPLE } from '../src/lib/quizCsv';

describe('Prelims Quiz CSV Parser', () => {
  it('parses valid sample CSV without errors', () => {
    const result = parseQuizCsv(QUIZ_CSV_SAMPLE);
    expect(result.errors).toHaveLength(0);
    expect(result.questions).toHaveLength(1);
    const q = result.questions[0];
    expect(q.correctIndex).toBe(2);
    expect(q.gsPaper).toBe('GS-2');
    expect(q.optionsEn).toHaveLength(4);
    expect(q.statementsEn).toHaveLength(2);
  });

  it('rejects rows with fewer than 9 columns', () => {
    const badCsv = 'Question 1 | only two pipes';
    const result = parseQuizCsv(badCsv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.questions).toHaveLength(0);
  });

  it('validates invalid CorrectIdx', () => {
    const badIdxCsv = 'Question | Stmt | OptA | OptB | OptC | OptD | 5 | Exp | Polity | GS-2';
    const result = parseQuizCsv(badIdxCsv);
    expect(result.errors.some((e) => e.includes('CorrectIdx'))).toBe(true);
  });

  it('parsePipeDelimitedQuizCsv returns valid flag', () => {
    const res = parsePipeDelimitedQuizCsv(QUIZ_CSV_SAMPLE);
    expect(res.valid).toBe(true);
    expect(res.questions.length).toBeGreaterThan(0);
  });
});
