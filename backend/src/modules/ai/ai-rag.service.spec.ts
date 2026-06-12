import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';

describe('AiRagService', () => {
  const aiSettings = {
    getSettings: jest.fn(),
  };

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiRagService,
        { provide: AiSettingsService, useValue: aiSettings },
      ],
    }).compile();
    expect(moduleRef.get(AiRagService)).toBeInstanceOf(AiRagService);
  });

  it('delegates to settings-backed rag resolution', async () => {
    aiSettings.getSettings.mockResolvedValue({
      rag: {
        enabled: true,
        documents: [
          {
            id: '1',
            title: 'Waitlist SOP',
            content: 'Offer cancelled slots to waitlist customers first.',
            type: 'sop',
            enabled: true,
          },
        ],
      },
    });
    const service = new AiRagService(aiSettings as any);
    const block = await service.buildRagContextBlock(
      'biz-1',
      'waitlist slot offer',
    );
    expect(block).toContain('Waitlist SOP');
    expect(aiSettings.getSettings).toHaveBeenCalledWith('biz-1');
  });

  it('returns empty block when rag disabled in settings', async () => {
    aiSettings.getSettings.mockResolvedValue({
      rag: { enabled: false, documents: [] },
    });
    const service = new AiRagService(aiSettings as any);
    await expect(
      service.buildRagContextBlock('biz-1', 'waitlist'),
    ).resolves.toBe('');
  });

  it('registers and searches semantic anchor index', () => {
    const service = new AiRagService(aiSettings as any);
    service.registerSemanticAnchors([
      {
        id: 'test-anchor',
        action: 'create_booking',
        phrase: 'book the first available slot',
        locale: 'en',
        surfaces: ['dashboard'],
      },
    ]);
    service.setSemanticAnchorEmbedding('test-anchor', [1, 0, 0]);
    const hits = service.searchSemanticAnchors([0.99, 0.01, 0], {
      surface: 'dashboard',
      minScore: 0.5,
    });
    expect(hits[0]?.id).toBe('test-anchor');
  });
});
