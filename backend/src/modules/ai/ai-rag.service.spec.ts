import { describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiRagService } from './ai-rag.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiSemanticIntentService } from './ai-semantic-intent.service.js';
import { AiSemanticPhrasingBankService } from './ai-semantic-phrasing-bank.service.js';
import { AiClassificationFewShotService } from './ai-classification-fewshot.service.js';

describe('AiRagService', () => {
  const aiSettings = {
    getSettings: jest.fn(),
  };
  const semanticIntent = {
    matchIntent: jest.fn(),
  };
  const phrasingBank = {
    warmEmbeddingIndex: jest.fn(),
    getIndexStats: jest.fn(),
    getPhraseBank: jest.fn(),
  };
  const fewShotRetriever = {
    retrieveForClassifierAppendix: jest.fn(),
  };

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiRagService,
        { provide: AiSettingsService, useValue: aiSettings },
        { provide: AiSemanticIntentService, useValue: semanticIntent },
        { provide: AiSemanticPhrasingBankService, useValue: phrasingBank },
        { provide: AiClassificationFewShotService, useValue: fewShotRetriever },
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
    const service = new AiRagService(
      aiSettings as never,
      semanticIntent as never,
      phrasingBank as never,
      fewShotRetriever as never,
    );
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
    const service = new AiRagService(
      aiSettings as never,
      semanticIntent as never,
      phrasingBank as never,
      fewShotRetriever as never,
    );
    await expect(
      service.buildRagContextBlock('biz-1', 'waitlist'),
    ).resolves.toBe('');
  });

  it('acc-3.11 — delegates semantic intent rescue to AiSemanticIntentService', async () => {
    semanticIntent.matchIntent.mockResolvedValue({
      action: 'create_booking',
      confidence: 0.91,
      matchedPhraseId: 'sem-en-create-booking-paraphrase-1',
      source: 'embedding',
    });
    const service = new AiRagService(
      aiSettings as never,
      semanticIntent as never,
      phrasingBank as never,
      fewShotRetriever as never,
    );

    const match = await service.matchSemanticIntent(
      'biz-1',
      'Put Maria on the books for facemassage tomorrow at 14:00',
      'dashboard',
    );

    expect(semanticIntent.matchIntent).toHaveBeenCalledWith({
      businessId: 'biz-1',
      prompt: 'Put Maria on the books for facemassage tomorrow at 14:00',
      surface: 'dashboard',
      entityMemory: undefined,
    });
    expect(match?.source).toBe('embedding');
  });

  it('acc-3.12 — exposes phrasing bank warm + stats via AiRagService', async () => {
    phrasingBank.warmEmbeddingIndex.mockResolvedValue({
      phraseCount: 36,
      embeddedCount: 36,
      indexWarmed: true,
      byLocale: { en: 20, hy: 8, ru: 8 },
      bySource: { canonical: 26, eval_paraphrase: 10 },
    });
    phrasingBank.getIndexStats.mockReturnValue({
      phraseCount: 36,
      embeddedCount: 36,
      indexWarmed: true,
      byLocale: { en: 20, hy: 8, ru: 8 },
      bySource: { canonical: 26, eval_paraphrase: 10 },
    });

    const service = new AiRagService(
      aiSettings as never,
      semanticIntent as never,
      phrasingBank as never,
      fewShotRetriever as never,
    );

    const warmed = await service.warmSemanticPhrasingIndex('biz-1', 'dashboard');
    const stats = service.getSemanticPhrasingBankStats('dashboard');

    expect(phrasingBank.warmEmbeddingIndex).toHaveBeenCalledWith(
      'biz-1',
      'dashboard',
    );
    expect(warmed.indexWarmed).toBe(true);
    expect(stats.byLocale.hy).toBeGreaterThan(0);
  });

  it('n99-2.4 — delegates classify few-shot retrieval to AiClassificationFewShotService', async () => {
    fewShotRetriever.retrieveForClassifierAppendix.mockResolvedValue([
      {
        id: 'sem-en-create_booking-1',
        prompt: 'Register Maria for facemassage tomorrow at two pm',
        action: 'create_booking',
        surface: 'dashboard',
      },
    ]);
    const service = new AiRagService(
      aiSettings as never,
      semanticIntent as never,
      phrasingBank as never,
      fewShotRetriever as never,
    );

    const hits = await service.retrieveClassificationFewShots({
      businessId: 'biz-1',
      prompt: 'Register Maria for facemassage tomorrow at two pm',
      surface: 'dashboard',
    });

    expect(fewShotRetriever.retrieveForClassifierAppendix).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        prompt: 'Register Maria for facemassage tomorrow at two pm',
        surface: 'dashboard',
      }),
      expect.any(Number),
    );
    expect(hits.some((entry) => entry.action === 'create_booking')).toBe(true);
  });
});
