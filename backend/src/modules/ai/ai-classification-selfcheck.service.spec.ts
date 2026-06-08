import { AiClassificationSelfCheckService } from './ai-classification-selfcheck.service.js';

describe('AiClassificationSelfCheckService (acc-3.4)', () => {
  const openAi = {
    isAvailableForBusiness: jest.fn(async () => true),
    completeJson: jest.fn(),
  };

  const service = new AiClassificationSelfCheckService(openAi as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifyClassification uses rules only when skipLlmSelfCheck is set', async () => {
    const verification = await service.verifyClassification({
      businessId: 'biz-1',
      prompt: 'How many appointments did we have today',
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {}, confidence: 0.95 },
      skipLlmSelfCheck: true,
    });
    expect(verification.ok).toBe(false);
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });

  it('verifyClassification runs LLM pass on rule mismatch', async () => {
    openAi.completeJson.mockResolvedValue({
      satisfies: false,
      confidence: 0.15,
      reason: 'analytics question not a booking',
    });
    const verification = await service.verifyClassification({
      businessId: 'biz-1',
      prompt: 'How many appointments did we have today',
      surface: 'dashboard',
      intent: { action: 'create_booking', params: {}, confidence: 0.95 },
    });
    expect(openAi.completeJson).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'classify_self_check' }),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ maxTokens: 120 }),
    );
    expect(verification.ok).toBe(false);
    expect(verification.source).toBe('rules+llm');
  });
});
