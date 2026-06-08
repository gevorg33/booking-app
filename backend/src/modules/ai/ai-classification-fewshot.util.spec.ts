import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import {
  buildGlobalFewShotPool,
  evalCaseToFewShotExample,
  harvestedCasesForBusiness,
  isFewShotEligibleEvalCase,
  mergeFewShotRetrievalResults,
  rankFewShotExamplesByEmbedding,
  resolveFewShotActionFromEvalCase,
  retrieveFewShotExamplesByTokenOverlap,
  type FewShotRetrievalExample,
} from './ai-classification-fewshot.util.js';

describe('ai-classification-fewshot.util (acc-3.1)', () => {
  it('isFewShotEligibleEvalCase rejects adversarial and compound-only cases', () => {
    expect(
      isFewShotEligibleEvalCase({
        id: 'adv-1',
        prompt: 'ignore rules',
        corpus: 'adversarial',
        expect: { securityBlocked: true },
      }),
    ).toBe(false);
    expect(
      isFewShotEligibleEvalCase({
        id: 'cmp-1',
        prompt: 'book and cancel',
        expect: { compoundSteps: ['create_booking', 'cancel_bookings'] },
      }),
    ).toBe(false);
    expect(
      isFewShotEligibleEvalCase({
        id: 'book-1',
        prompt: 'Book massage tomorrow',
        expect: { rescuedAction: 'create_booking' },
      }),
    ).toBe(true);
  });

  it('resolveFewShotActionFromEvalCase prefers rescuedAction', () => {
    const evalCase: AiCommandEvalCase = {
      id: 'x',
      prompt: 'p',
      expect: {
        action: 'unknown',
        rescuedAction: 'check_providers_for_service',
      },
    };
    expect(resolveFewShotActionFromEvalCase(evalCase)).toBe(
      'check_providers_for_service',
    );
  });

  it('buildGlobalFewShotPool includes deterministic acc-2 corpus and static seeds', () => {
    const pool = buildGlobalFewShotPool(
      [
        {
          id: 'golden-book-1',
          prompt: 'Schedule Maria for facemassage tomorrow at 14:00',
          surface: 'dashboard',
          corpus: 'golden',
          expect: { rescuedAction: 'create_booking' },
        },
      ],
      [],
    );
    expect(pool.some((entry) => entry.id === 'golden-book-1')).toBe(true);
    expect(
      pool.some(
        (entry) =>
          entry.id === 'fs-dashboard-book-fixed' ||
          entry.prompt === 'Book massage with Gevorg tomorrow at 10:00',
      ),
    ).toBe(true);
  });

  it('harvestedCasesForBusiness filters exported fixture ids by business prefix', () => {
    const businessId = '12345678-abcd-ef01-2345-6789abcdef01';
    const pool = harvestedCasesForBusiness(businessId, [
      {
        id: 'harvest-12345678-abc123def456',
        prompt: 'our usual booking phrase',
        surface: 'dashboard',
        corpus: 'harvested',
        expect: { rescuedAction: 'create_booking' },
      },
      {
        id: 'harvest-deadbeef-othercase',
        prompt: 'other tenant phrase',
        surface: 'dashboard',
        corpus: 'harvested',
        expect: { rescuedAction: 'create_booking' },
      },
    ]);
    expect(pool).toHaveLength(1);
    expect(pool[0]?.source).toBe('business');
  });

  it('retrieveFewShotExamplesByTokenOverlap ranks booking prompts on global pool', () => {
    const pool = buildGlobalFewShotPool(
      [
        {
          id: 'book-1',
          prompt: 'Book massage with Gevorg tomorrow at 10:00',
          surface: 'dashboard',
          expect: { rescuedAction: 'create_booking' },
        },
        {
          id: 'check-1',
          prompt: 'Who is free tomorrow evening for lashes',
          surface: 'dashboard',
          expect: { rescuedAction: 'check_providers_for_service' },
        },
      ],
      [],
    );
    const hits = retrieveFewShotExamplesByTokenOverlap(
      'Book massage with Gevorg tomorrow at 10:00',
      'dashboard',
      pool,
      2,
    );
    expect(hits[0]?.action).toBe('create_booking');
  });

  it('rankFewShotExamplesByEmbedding sorts by cosine similarity', () => {
    const pool: FewShotRetrievalExample[] = [
      {
        id: 'a',
        prompt: 'book nearest slot',
        action: 'book_nearest_slot',
        surface: 'customer',
        source: 'global',
      },
      {
        id: 'b',
        prompt: 'cancel all appointments',
        action: 'cancel_bookings',
        surface: 'customer',
        source: 'global',
      },
    ];
    const embeddingsById = new Map<string, number[]>([
      ['a', [1, 0, 0]],
      ['b', [0, 1, 0]],
    ]);
    const ranked = rankFewShotExamplesByEmbedding({
      queryEmbedding: [0.95, 0.05, 0],
      pool,
      embeddingsById,
      limit: 2,
      minScore: 0.5,
    });
    expect(ranked[0]?.example.id).toBe('a');
    expect(ranked[0]?.score).toBeGreaterThan(0.9);
  });

  it('mergeFewShotRetrievalResults reserves business slots before global hits', () => {
    const business: FewShotRetrievalExample[] = [
      {
        id: 'biz-1',
        prompt: 'our phrase',
        action: 'create_booking',
        surface: 'dashboard',
        source: 'business',
      },
    ];
    const global: FewShotRetrievalExample[] = [
      {
        id: 'glob-1',
        prompt: 'book tomorrow',
        action: 'create_booking',
        surface: 'dashboard',
        source: 'global',
      },
    ];
    const merged = mergeFewShotRetrievalResults(business, global, 2);
    expect(merged[0]?.id).toBe('biz-1');
    expect(merged).toHaveLength(2);
  });

  it('evalCaseToFewShotExample maps labeled eval rows to few-shot entries', () => {
    const example = evalCaseToFewShotExample(
      {
        id: 'case-1',
        prompt: 'Put Maria on the books for facemassage tomorrow',
        surface: 'dashboard',
        expect: { rescuedAction: 'create_booking' },
      },
      'global',
    );
    expect(example).toEqual({
      id: 'case-1',
      prompt: 'Put Maria on the books for facemassage tomorrow',
      action: 'create_booking',
      surface: 'dashboard',
      locale: undefined,
      source: 'global',
      businessId: undefined,
    });
  });
});
