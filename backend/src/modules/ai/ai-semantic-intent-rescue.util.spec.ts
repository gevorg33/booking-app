import { trySemanticIntentRescue } from './ai-semantic-intent-rescue.util.js';
import type { AiSemanticIntentService } from './ai-semantic-intent.service.js';

describe('ai-semantic-intent-rescue.util', () => {
  it('skips semantic rescue when confidence is high', async () => {
    const semanticIntent = {
      match: jest.fn(),
    } as unknown as AiSemanticIntentService;

    const result = await trySemanticIntentRescue(semanticIntent, {
      businessId: 'biz-1',
      effectivePrompt: 'show appointments today',
      parsed: {
        action: 'show_appointments',
        params: {},
        reasoning: 'test',
        confidence: 0.95,
      },
      surface: 'dashboard',
      confidenceLow: 0.55,
      confidenceHigh: 0.85,
      normalizePrompt: async () => ({
        original: 'show appointments today',
        normalized: 'show appointments today',
        method: 'passthrough' as const,
        classifierContext: null,
      }),
    });

    expect(result).toBeNull();
    expect(semanticIntent.match).not.toHaveBeenCalled();
  });

  it('rescues unknown prompts via semantic matcher', async () => {
    const semanticIntent = {
      match: jest.fn().mockResolvedValue({
        action: 'create_booking',
        confidence: 0.82,
        anchorId: 'en-book-gap-soonest',
        paramHints: { bookingFirstAvailable: true },
        reasoning: 'Semantic intent match',
        rescueReason: 'semantic_match',
      }),
    } as unknown as AiSemanticIntentService;

    const result = await trySemanticIntentRescue(semanticIntent, {
      businessId: 'biz-1',
      effectivePrompt: 'Book massage on whoever has a gap soonest',
      parsed: {
        action: 'unknown',
        params: {},
        reasoning: 'low confidence',
        confidence: 0.2,
      },
      surface: 'dashboard',
      confidenceLow: 0.55,
      confidenceHigh: 0.85,
      normalizePrompt: async () => ({
        original: 'Book massage on whoever has a gap soonest',
        normalized: 'Book massage on whoever has a gap soonest',
        method: 'passthrough' as const,
        classifierContext: null,
      }),
    });

    expect(result?.parsed.action).toBe('create_booking');
    expect(result?.parsed.params.bookingFirstAvailable).toBe(true);
    expect(result?.semantic.rescueReason).toBe('semantic_match');
  });
});
