import { describe, expect, it } from 'vitest';
import { localRepo } from '../src/lib/db/localRepo';
import type { MainsQuestion } from '../src/types';

describe('Admin Dashboard & Production Release Readiness', () => {
  it('lists all student mains submissions and allows faculty grading', async () => {
    expect(localRepo.listAllSubmissions).toBeDefined();
    expect(localRepo.gradeMainsSubmission).toBeDefined();

    const sampleQuestion: MainsQuestion = {
      id: 'mq-test-1',
      title: 'Judicial Review and Separation of Powers',
      gsPaper: 'GS-2',
      subject: 'Indian Constitution',
      marks: 15,
      wordLimit: 250,
      prompt: 'Examine the evolution of the Basic Structure doctrine as a safeguard of judicial review.',
      suggestedTimeMin: 11,
      framework: {
        intro: 'Origin in Kesavananda Bharati case (1973)',
        dimensions: [{ title: 'Constitutional balance', points: ['Limits Article 368 amending power'] }],
        statutoryOrDataRefs: ['Minerva Mills (1980)', 'Indira Gandhi v. Raj Narain (1975)'],
        wayForward: ['Institutional restraint and constructive constitutionalism'],
        conclusion: 'Dynamic equilibrium between parliamentary democracy and constitutional supremacy.',
      },
      modelAnswerSnippet: 'The Basic Structure doctrine remains the bedrock of Indian constitutional jurisprudence...',
      publishDate: '2026-10-24',
    };

    // 1. Submit an answer as a student
    const studentUid = 'student-test-uid-42';
    const submission = await localRepo.submitAndEvaluateMains(
      studentUid,
      sampleQuestion,
      'The doctrine of basic structure was propounded in Kesavananda Bharati (1973). It maintains that while Parliament has wide powers under Article 368, it cannot alter the essential identity of the Constitution...'
    );

    expect(submission.id).toBeDefined();
    expect(submission.userId).toBe(studentUid);

    // 2. Admin retrieves all submissions
    const allSubs = await localRepo.listAllSubmissions!();
    expect(allSubs.length).toBeGreaterThan(0);
    const target = allSubs.find((s) => s.id === submission.id);
    expect(target).toBeDefined();

    // 3. Faculty evaluates and awards custom score and remarks
    const graded = await localRepo.gradeMainsSubmission!(
      submission.id,
      10.5,
      'Excellent constitutional citations. Include recent NJAC verdict (2015) in paragraph 3 to elevate score to 11.5+.',
      {
        strengths: ['Precise Kesavananda Bharati case law reference', 'Logical structure and smooth paragraph transitions'],
        improvements: ['Cite NJAC 2015 and Waman Rao (1981) for judicial review chronology'],
      }
    );

    expect(graded.score).toBe(10.5);
    expect(graded.feedback).toContain('NJAC verdict');
    expect(graded.status).toBe('evaluated');
    expect(graded.evaluation?.strengths).toHaveLength(2);
  });

  it('allows admin to publish and delete broadcast seminars smoothly', async () => {
    const newBroadcast = await localRepo.createBroadcast({
      title: 'Admin Masterclass: Fiscal Federalism & 16th Finance Commission',
      subject: 'GS-2',
      faculty: 'Dr. S. Sharma (Faculty Director)',
      facultyDesignation: 'Director & UPSC Mentor',
      source: 'youtube',
      streamUrl: 'https://youtube.com/watch?v=admin_live_demo',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      durationMinutes: 90,
      status: 'scheduled',
      topicsCovered: ['Article 280', 'Cess and Surcharges', 'Horizontal Devolution'],
      chatEnabled: true,
    });

    expect(newBroadcast.id).toBeDefined();
    expect(newBroadcast.title).toContain('Fiscal Federalism');

    const list = await localRepo.listBroadcasts();
    expect(list.some((b) => b.id === newBroadcast.id)).toBe(true);

    // Delete broadcast
    await localRepo.deleteBroadcast(newBroadcast.id);
    const updatedList = await localRepo.listBroadcasts();
    expect(updatedList.some((b) => b.id === newBroadcast.id)).toBe(false);
  });
});
