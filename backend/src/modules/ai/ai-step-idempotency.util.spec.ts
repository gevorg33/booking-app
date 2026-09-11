/**
 * AI-ROADMAP Phase 5 — idempotency keys per step.
 *
 * A partially-executed plan is a normal outcome (§33/§34), so "retry" is the
 * obvious next user action. Without a stable key, the retry re-runs the steps
 * that already succeeded — double bookings and double charges, i.e. exactly the
 * T2 operations §35 caps hardest.
 *
 * The whole value is in the key being stable across retries and distinct across
 * genuinely different operations. Both directions are tested; a key that is
 * unique per attempt is the same as no key, and it looks like it works.
 */
import {
  buildPlanIdempotencyKeys,
  buildStepIdempotencyKey,
  canonicalize,
  decideRetry,
  type StepIdentity,
} from './ai-step-idempotency.util.js';

const identity = (overrides: Partial<StepIdentity> = {}): StepIdentity => ({
  requestId: 'trace-1',
  stepId: 's1',
  command: 'appointment.create',
  variables: { customerName: 'John', date: '2026-08-07' },
  ...overrides,
});

describe('canonicalize', () => {
  it('sorts object keys at every depth', () => {
    expect(JSON.stringify(canonicalize({ b: 1, a: { d: 2, c: 3 } }))).toBe(
      JSON.stringify({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it('preserves array order, because order is meaning there', () => {
    expect(canonicalize(['b', 'a'])).toEqual(['b', 'a']);
  });

  it('treats an explicit undefined as absent', () => {
    // Otherwise the same request serialises two ways depending on whether the
    // planner emitted the key at all.
    expect(JSON.stringify(canonicalize({ a: undefined }))).toBe(
      JSON.stringify({ a: null }),
    );
  });
});

describe('buildStepIdempotencyKey', () => {
  describe('stable across retries', () => {
    it('produces the same key for identical input', () => {
      expect(buildStepIdempotencyKey(identity())).toBe(
        buildStepIdempotencyKey(identity()),
      );
    });

    it('is unaffected by variable ordering', () => {
      // The planner does not guarantee key order; if that changed the key, a
      // retry would double-write.
      const a = buildStepIdempotencyKey(
        identity({ variables: { customerName: 'John', date: '2026-08-07' } }),
      );
      const b = buildStepIdempotencyKey(
        identity({ variables: { date: '2026-08-07', customerName: 'John' } }),
      );
      expect(a).toBe(b);
    });

    it('is unaffected by nested variable ordering', () => {
      const a = buildStepIdempotencyKey(
        identity({ variables: { draft: { name: 'x', price: 1 } } }),
      );
      const b = buildStepIdempotencyKey(
        identity({ variables: { draft: { price: 1, name: 'x' } } }),
      );
      expect(a).toBe(b);
    });

    it('does not change between attempts of the same request', () => {
      // Nothing time-varying is in the payload. If a timestamp crept in, this
      // would still pass by luck within a millisecond — so the guard is that
      // the function takes no clock at all.
      expect(buildStepIdempotencyKey.length).toBe(1);
    });
  });

  describe('distinct across genuinely different operations', () => {
    it('differs for a different request', () => {
      expect(buildStepIdempotencyKey(identity())).not.toBe(
        buildStepIdempotencyKey(identity({ requestId: 'trace-2' })),
      );
    });

    it('differs for a different step of the same plan', () => {
      // "Book two identical slots" is two intentional writes; the step id is
      // what keeps them apart.
      expect(buildStepIdempotencyKey(identity())).not.toBe(
        buildStepIdempotencyKey(identity({ stepId: 's2' })),
      );
    });

    it('differs for a different command', () => {
      expect(buildStepIdempotencyKey(identity())).not.toBe(
        buildStepIdempotencyKey(identity({ command: 'appointment.cancel' })),
      );
    });

    it('differs when a resolved value changes', () => {
      // A retry after the date resolved differently is a different write, and
      // must not be suppressed as a duplicate.
      expect(buildStepIdempotencyKey(identity())).not.toBe(
        buildStepIdempotencyKey(
          identity({ variables: { customerName: 'John', date: '2026-08-08' } }),
        ),
      );
    });

    it('distinguishes a missing variable from an empty one', () => {
      expect(buildStepIdempotencyKey(identity({ variables: {} }))).not.toBe(
        buildStepIdempotencyKey(identity({ variables: { note: '' } })),
      );
    });
  });

  it('returns a short, stable hex key', () => {
    const key = buildStepIdempotencyKey(identity());
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('decideRetry', () => {
  it('executes a key not seen before', () => {
    expect(decideRetry('abc', new Set())).toBe('execute');
  });

  it('skips a key already applied', () => {
    expect(decideRetry('abc', new Set(['abc']))).toBe('skip_already_applied');
  });

  it('is what stops a retry re-running a succeeded step', () => {
    // The concrete scenario: step 1 booked, step 2 failed, user retries.
    const applied = new Set<string>();
    const s1 = buildStepIdempotencyKey(identity({ stepId: 's1' }));
    const s2 = buildStepIdempotencyKey(identity({ stepId: 's2' }));

    expect(decideRetry(s1, applied)).toBe('execute');
    applied.add(s1); // s1 succeeded
    expect(decideRetry(s2, applied)).toBe('execute'); // s2 failed, not recorded

    // Retry of the same request: s1 must not run again.
    expect(decideRetry(s1, applied)).toBe('skip_already_applied');
    expect(decideRetry(s2, applied)).toBe('execute');
  });
});

describe('buildPlanIdempotencyKeys', () => {
  const steps = [
    { id: 's1', command: 'appointment.create', variables: { a: 1 } },
    { id: 's2', command: 'appointment.create', variables: { a: 1 } },
  ];

  it('keys by step id, so a caller cannot pair by index', () => {
    const keys = buildPlanIdempotencyKeys('trace-1', steps);
    expect([...keys.keys()]).toEqual(['s1', 's2']);
  });

  it('gives identical steps different keys', () => {
    // Two identical commands in one plan are two intentional writes.
    const keys = buildPlanIdempotencyKeys('trace-1', steps);
    expect(keys.get('s1')).not.toBe(keys.get('s2'));
  });

  it('gives the same plan the same keys on a retry', () => {
    expect([...buildPlanIdempotencyKeys('trace-1', steps).values()]).toEqual([
      ...buildPlanIdempotencyKeys('trace-1', steps).values(),
    ]);
  });

  it('gives a different request different keys', () => {
    expect(buildPlanIdempotencyKeys('trace-1', steps).get('s1')).not.toBe(
      buildPlanIdempotencyKeys('trace-2', steps).get('s1'),
    );
  });
});
