import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiConversationSummaryService } from './ai-conversation-summary.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';

describe('AiConversationSummaryService', () => {
  const openAi = {
    isAvailableForBusiness: jest.fn(),
    completeJson: jest.fn(),
  };

  let service: AiConversationSummaryService;

  const longHistory = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: `turn-${index}`,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiConversationSummaryService(openAi as any);
  });

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiConversationSummaryService,
        { provide: OpenAiGatewayService, useValue: openAi },
      ],
    }).compile();
    expect(moduleRef.get(AiConversationSummaryService)).toBeInstanceOf(AiConversationSummaryService);
  });

  it('returns empty history when input is missing', async () => {
    await expect(
      service.prepareHistoryForClassifier('biz-1', undefined, 'dashboard'),
    ).resolves.toEqual({ history: [] });
    await expect(
      service.prepareHistoryForClassifier('biz-1', [], 'dashboard'),
    ).resolves.toEqual({ history: [] });
  });

  it('truncates short threads without summarization', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    const short = longHistory.slice(0, 5);
    const result = await service.prepareHistoryForClassifier('biz-1', short, 'dashboard');
    expect(result.history).toHaveLength(5);
    expect(result.summaryBlock).toBeUndefined();
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });

  it('summarizes older turns for dashboard handoff', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      summary: 'User asked to cancel Maria appointment',
      keyEntities: { employeeName: 'Maria' },
    });
    const result = await service.prepareHistoryForClassifier('biz-1', longHistory, 'dashboard');
    expect(result.history).toHaveLength(4);
    expect(result.summaryBlock).toContain('Maria');
    expect(openAi.completeJson).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'dashboard', operation: 'conversation_summary' }),
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('summarizes provider_mobile threads', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({ summary: 'Mobile handoff context' });
    const result = await service.prepareHistoryForClassifier(
      'biz-1',
      longHistory,
      'provider_mobile',
    );
    expect(result.summaryBlock).toContain('Mobile handoff context');
    expect(openAi.completeJson).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'provider_mobile' }),
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('falls back to truncated history when OpenAI unavailable', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    const result = await service.prepareHistoryForClassifier('biz-1', longHistory, 'dashboard');
    expect(result.history).toHaveLength(6);
    expect(result.summaryBlock).toBeUndefined();
  });

  it('returns recent tail when summarization returns no summary', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({});
    const result = await service.prepareHistoryForClassifier('biz-1', longHistory, 'dashboard');
    expect(result.history).toHaveLength(4);
    expect(result.summaryBlock).toBeUndefined();
  });
});
