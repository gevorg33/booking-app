/**
 * AI-ROADMAP Phase 9 — mining traces for misses.
 *
 * Two measurements against the 5,362 production traces shaped this, and both
 * are pinned below as behaviour:
 *
 *   - 579 messages follow a failure within five minutes, but sampling showed
 *     most are a *different question*. Counting them all would produce a queue
 *     that is mostly noise, and a noisy queue does not get worked.
 *   - 153 follow a *clarify*. Those are answers — the system working — and
 *     labelling them misses would penalise the behaviour §38 is built on.
 */
import {
  contentTokens,
  DEFAULT_SIMILARITY_THRESHOLD,
  detectMisses,
  mineMisses,
  promptSimilarity,
  rankMissesByAction,
  type MinableTrace,
} from './ai-miss-mining.util.js';

let clock = 0;
const trace = (overrides: Partial<MinableTrace> = {}): MinableTrace => {
  clock += 1000;
  return {
    traceId: `t${clock}`,
    userId: 'u1',
    businessId: 'b1',
    createdAt: new Date(clock),
    promptRaw: 'mark Karo appointment as done',
    action: 'mark_paid',
    outcome: 'failed',
    ...overrides,
  };
};

beforeEach(() => {
  clock = 0;
});

describe('promptSimilarity', () => {
  it('scores a genuine rewording high', () => {
    // A real pair from the corpus.
    expect(
      promptSimilarity(
        "mark Karo's appointment as done and paid",
        "mark Karo Mazmanyan's appointment as done and paid",
      ),
    ).toBeGreaterThan(DEFAULT_SIMILARITY_THRESHOLD);
  });

  it('scores a topic change low', () => {
    // Also from the corpus: these follow each other within two minutes.
    expect(
      promptSimilarity(
        'how much would a 100 dollar gift card cost?',
        'please cancel gift card order QATEST-REDEEMED',
      ),
    ).toBeLessThan(DEFAULT_SIMILARITY_THRESHOLD);
  });

  it('scores an identical retry at 1', () => {
    expect(promptSimilarity('cancel my booking', 'cancel my booking')).toBe(1);
  });

  it('ignores filler words', () => {
    // Otherwise "please could you..." pairs would score high on nothing.
    expect(contentTokens('please could you do the thing')).not.toContain(
      'please',
    );
    expect(promptSimilarity('please the a of', 'would this that it')).toBe(0);
  });

  it('returns 0 rather than NaN for an empty prompt', () => {
    expect(promptSimilarity('', 'cancel my booking')).toBe(0);
  });
});

describe('detectMisses', () => {
  describe('rephrase_retry', () => {
    it('flags a failure followed by a reworded retry', () => {
      const found = detectMisses([
        trace({ promptRaw: "mark Karo's appointment as done" }),
        trace({
          promptRaw: "mark Karo Mazmanyan's appointment as done",
          outcome: 'executed',
        }),
      ]);
      expect(found.map((f) => f.signal)).toContain('rephrase_retry');
      expect(found[0].evidencePrompt).toContain('Mazmanyan');
    });

    it('does not flag a failure followed by a different question', () => {
      // The 579-follow-ups finding: most are topic changes.
      const found = detectMisses([
        trace({ promptRaw: 'how much would a 100 dollar gift card cost' }),
        trace({
          promptRaw: 'please cancel gift card order QATEST',
          outcome: 'executed',
        }),
      ]);
      expect(found.map((f) => f.signal)).not.toContain('rephrase_retry');
    });

    it('does not flag a retry outside the window', () => {
      const first = trace({ promptRaw: 'cancel my booking today' });
      const later = trace({
        promptRaw: 'cancel my booking today',
        createdAt: new Date(first.createdAt.getTime() + 60 * 60 * 1000),
        outcome: 'executed',
      });
      expect(detectMisses([first, later])).toEqual([]);
    });
  });

  describe('what it deliberately does not flag', () => {
    it('ignores a follow-up after a clarify', () => {
      // 153 of these. They are answers, and §38 exists to make them work.
      const found = detectMisses([
        trace({ promptRaw: 'cancel my booking', outcome: 'clarified' }),
        trace({
          promptRaw: 'cancel my booking the 3pm one',
          outcome: 'executed',
        }),
      ]);
      expect(found).toEqual([]);
    });

    it('ignores a successful command followed by anything', () => {
      const found = detectMisses([
        trace({ promptRaw: 'cancel my booking', outcome: 'executed' }),
        trace({ promptRaw: 'cancel my booking', outcome: 'executed' }),
      ]);
      expect(found).toEqual([]);
    });
  });

  describe('repeated_failure', () => {
    it('flags the same command failing twice in one sitting', () => {
      const found = detectMisses([
        trace({
          action: 'claim_referral_code',
          promptRaw: 'claim my code ABC',
        }),
        trace({ action: 'claim_referral_code', promptRaw: 'use referral XYZ' }),
      ]);
      expect(found.map((f) => f.signal)).toContain('repeated_failure');
    });

    it('does not flag two failures far apart', () => {
      const first = trace({ action: 'claim_referral_code' });
      const later = trace({
        action: 'claim_referral_code',
        createdAt: new Date(first.createdAt.getTime() + 60 * 60 * 1000),
      });
      expect(
        detectMisses([first, later]).filter(
          (f) => f.signal === 'repeated_failure',
        ),
      ).toEqual([]);
    });
  });

  describe('negative_feedback', () => {
    it('attributes the feedback to the message before it', () => {
      // The feedback is about what just happened, not about itself.
      const found = detectMisses([
        trace({
          action: 'create_booking',
          promptRaw: 'book me friday',
          outcome: 'executed',
        }),
        trace({
          action: 'give_ai_feedback',
          promptRaw: 'that was wrong',
          outcome: 'executed',
        }),
      ]);
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        signal: 'negative_feedback',
        action: 'create_booking',
        prompt: 'book me friday',
      });
    });

    it('falls back to the feedback itself when it is the first message', () => {
      const found = detectMisses([
        trace({
          action: 'give_ai_feedback',
          promptRaw: 'this is bad',
          outcome: 'executed',
        }),
      ]);
      expect(found[0].action).toBe('give_ai_feedback');
    });
  });
});

describe('mineMisses', () => {
  it('keeps users separate, so one user cannot look like another retrying', () => {
    const found = mineMisses([
      trace({ userId: 'u1', promptRaw: 'cancel booking friday' }),
      trace({
        userId: 'u2',
        promptRaw: 'cancel booking friday',
        outcome: 'executed',
      }),
    ]);
    expect(found).toEqual([]);
  });

  it('keeps businesses separate too', () => {
    const found = mineMisses([
      trace({ businessId: 'b1', promptRaw: 'cancel booking friday' }),
      trace({
        businessId: 'b2',
        promptRaw: 'cancel booking friday',
        outcome: 'executed',
      }),
    ]);
    expect(found).toEqual([]);
  });

  it('ignores traces with no user, since there is no sequence to reason about', () => {
    expect(
      mineMisses([
        trace({ userId: null }),
        trace({ userId: null, outcome: 'executed' }),
      ]),
    ).toEqual([]);
  });

  it('sorts an unordered history before looking for sequences', () => {
    const later = trace({
      promptRaw: 'mark Karo appointment as done',
      outcome: 'executed',
    });
    const earlier = trace({
      promptRaw: 'mark Karo appointment as done',
      createdAt: new Date(later.createdAt.getTime() - 1000),
    });
    expect(mineMisses([later, earlier]).length).toBeGreaterThan(0);
  });
});

describe('rankMissesByAction', () => {
  it('ranks by how many signals point at the same command', () => {
    // A command that is retried *and* complained about is a better use of the
    // next hour than one with a single noisy signal.
    const found = rankMissesByAction([
      {
        signal: 'rephrase_retry',
        traceId: 't1',
        action: 'compound_intent',
        prompt: '',
        evidenceTraceId: null,
        evidencePrompt: null,
        similarity: 0.9,
      },
      {
        signal: 'repeated_failure',
        traceId: 't2',
        action: 'compound_intent',
        prompt: '',
        evidenceTraceId: null,
        evidencePrompt: null,
        similarity: null,
      },
      {
        signal: 'negative_feedback',
        traceId: 't3',
        action: 'mark_paid',
        prompt: '',
        evidenceTraceId: null,
        evidencePrompt: null,
        similarity: null,
      },
    ]);
    expect(found[0]).toMatchObject({ action: 'compound_intent', total: 2 });
    expect(found[1].action).toBe('mark_paid');
  });

  it('returns nothing for no candidates', () => {
    expect(rankMissesByAction([])).toEqual([]);
  });
});
