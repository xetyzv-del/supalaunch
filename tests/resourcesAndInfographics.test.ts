import { describe, expect, it } from 'vitest';
import { localRepo } from '../src/lib/db/localRepo';
import { SEED_INFOGRAPHICS } from '../src/data/infographics';
import type { InfographicItem } from '../src/types';

describe('Daily Crux Infographics & Admin Resource Uploads', () => {
  it('provides rich vector SVG infographics in seed data', () => {
    expect(SEED_INFOGRAPHICS['topic-1']).toBeDefined();
    expect(SEED_INFOGRAPHICS['topic-1'].length).toBeGreaterThan(0);
    expect(SEED_INFOGRAPHICS['topic-1'][0].url).toContain('data:image/svg+xml');
    expect(SEED_INFOGRAPHICS['topic-1'][0].title).toContain('Digital Rupee');

    expect(SEED_INFOGRAPHICS['topic-2']).toBeDefined();
    expect(SEED_INFOGRAPHICS['topic-2'][0].title).toContain('Finance Commission');
  });

  it('allows staff to upload academic resources in PDF and JPG format', async () => {
    const adminUid = '00000000-0000-4000-8000-000000000001';

    // 1. Upload PDF resource
    const pdfItem = await localRepo.uploadResource(adminUid, true, {
      title: 'Economic Survey 2025-26 Volume 1 Core Synthesis',
      category: 'standard',
      gsPaper: 'GS-3',
      format: 'pdf',
      pages: 45,
      authorOrSource: 'Ministry of Finance / CivilEdge',
      summary: 'Comprehensive macroeconomic indicators, fiscal deficit targets, and capex multiplier metrics.',
      topicsCovered: ['Macroeconomics', 'Fiscal Deficit', 'Capex'],
    });

    expect(pdfItem.id).toBeDefined();
    expect(pdfItem.format).toBe('pdf');
    expect(pdfItem.moderationStatus).toBe('approved');

    // 2. Upload JPG infographic resource
    const sampleJpgData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    const jpgItem = await localRepo.uploadResource(adminUid, true, {
      title: 'Monetary Policy Transmission Mechanism Flowchart',
      category: 'standard',
      gsPaper: 'GS-3',
      format: 'jpg',
      pages: 1,
      authorOrSource: 'CivilEdge Faculty Bureau',
      summary: 'Visual diagram illustrating repo rate rate-cut pass-through via MCLR and external benchmark lending rates (EBLR).',
      topicsCovered: ['Monetary Policy', 'RBI', 'EBLR', 'Banking'],
      fileData: sampleJpgData,
    });

    expect(jpgItem.id).toBeDefined();
    expect(jpgItem.format).toBe('jpg');
    expect(jpgItem.fileData).toBe(sampleJpgData);

    // Open JPG resource and verify imageUrl is returned
    const { doc } = await localRepo.openResource(jpgItem);
    expect(doc.format).toBe('jpg');
    expect(doc.imageUrl).toBe(sampleJpgData);
    expect(doc.downloadFilename).toContain('.jpg');
  });

  it('updates topic infographics dynamically for daily crux carousel', async () => {
    const topics = await localRepo.listTopicsOfDay();
    expect(topics.length).toBeGreaterThan(0);
    const activeTopic = topics[0];

    const newSlide: InfographicItem = {
      id: 'custom-slide-1',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      title: 'Special Economic Zones & Foreign Trade Policy 2026',
      caption: 'Analytical chart showing merchandise vs services export trajectory.',
      source: 'Ministry of Commerce & DGFT',
      uploadedAt: new Date().toISOString(),
    };

    const updatedTopic = await localRepo.updateTopicInfographics(activeTopic.id, [newSlide]);
    expect(updatedTopic.infographics).toHaveLength(1);
    expect(updatedTopic.infographics?.[0].title).toBe('Special Economic Zones & Foreign Trade Policy 2026');

    // Verify persisted
    const reloaded = await localRepo.listTopicsOfDay();
    const found = reloaded.find((t) => t.id === activeTopic.id);
    expect(found?.infographics).toHaveLength(1);
    expect(found?.infographics?.[0].id).toBe('custom-slide-1');
  });
});
