import { ConfigService } from '@nestjs/config';
import { AiClassificationEscalationService } from './ai-classification-escalation.service.js';

describe('AiClassificationEscalationService (acc-3.5)', () => {
  const openAi = {
    isAvailableForBusiness: jest.fn(async () => true),
    completeJson: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'OPENAI_ESCALATION_MODEL' ? 'gpt-5.4' : undefined,
    ),
  };

  const service = new AiClassificationEscalationService(
    openAi as any,
    config as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolveEscalationModel reads OPENAI_ESCALATION_MODEL', () => {
    expect(service.resolveEscalationModel()).toBe('gpt-5.4');
  });

  it('applyTieBreakerIfNeeded replaces mutating classify with read-only tie-breaker result', async () => {
    openAi.completeJson.mockResolvedValue({
      action: 'check_providers_for_service',
      params: { allProviders: true, employeeName: null },
      confidence: 0.93,
      reasoning: 'User asked who is free, not to book',
      sideWith: 'deterministic',
    });

    const enriched = await service.applyTieBreakerIfNeeded(
      {
        businessId: 'biz-1',
        prompt: 'Who is free tomorrow evening for permanent lashes',
        surface: 'dashboard',
        intent: { action: 'create_booking', params: {}, confidence: 0.88 },
        deterministicRoute: { tier: 'read_only', reasoning: 'Read-only query pattern' },
        shortlist: ['unknown', 'create_booking', 'check_providers_for_service'],
      },
      {
        intent: { action: 'create_booking', params: {}, confidence: 0.88 },
        verification: {
          ok: false,
          confidence: 0.35,
          fieldConfidence: { action: 0.35 },
          reasons: ['availability mismatch'],
        },
        consensus: {
          needsEscalation: true,
          llmAction: 'create_booking',
          deterministicPreferredAction: 'check_providers_for_service',
          reason: 'router disagrees',
        },
      },
    );

    expect(openAi.completeJson).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'classify_tie_breaker' }),
      expect.stringContaining('acc-3.5'),
      expect.any(String),
      expect.objectContaining({ model: 'gpt-5.4', maxTokens: 450 }),
    );
    expect(enriched.intent.action).toBe('check_providers_for_service');
    expect(enriched.tieBreaker?.sideWith).toBe('deterministic');
    expect(enriched.consensus.needsEscalation).toBe(false);
    expect(enriched.intent.params?._classificationTieBreakerModel).toBe('gpt-5.4');
  });

  it('applyTieBreakerIfNeeded is skipped when skipEscalationTieBreaker is set', async () => {
    const enriched = await service.applyTieBreakerIfNeeded(
      {
        businessId: 'biz-1',
        prompt: 'Who is free tomorrow',
        surface: 'dashboard',
        intent: { action: 'create_booking', params: {} },
        skipEscalationTieBreaker: true,
      },
      {
        intent: { action: 'create_booking', params: {} },
        verification: {
          ok: false,
          confidence: 0.3,
          fieldConfidence: { action: 0.3 },
          reasons: [],
        },
        consensus: { needsEscalation: true, llmAction: 'create_booking' },
      },
    );
    expect(openAi.completeJson).not.toHaveBeenCalled();
    expect(enriched.tieBreaker).toBeUndefined();
  });
});
