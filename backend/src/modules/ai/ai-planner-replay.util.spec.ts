import {
  RESCUE_CORPUS_SQL,
  replayAccessTier,
  replayChurn,
  summarizeReplay,
  type ReplayOutcome,
} from './ai-planner-replay.util.js';

const outcome = (
  prompt: string,
  verdict: string,
  traces = 1,
): ReplayOutcome => ({
  prompt,
  truth: 't',
  traces,
  verdict,
  shortlistSize: 15,
});

describe('replayAccessTier', () => {
  it('gates the customer and public surfaces as client whatever the role says', () => {
    // The trace's `role` is the business role profile, not the access tier — a
    // business owner browsing the customer surface records `owner` and is gated
    // as `client`. Getting this wrong made a whole narrowing measurement wrong
    // once, because `isSpecAllowedForTier` is exact membership: `owner` on the
    // customer surface permits about seven commands.
    for (const surface of ['customer', 'public']) {
      expect(replayAccessTier(surface, 'owner')).toBe('client');
      expect(replayAccessTier(surface, 'receptionist')).toBe('client');
      expect(replayAccessTier(surface, null)).toBe('client');
    }
  });

  it('uses the recorded role on staff surfaces', () => {
    expect(replayAccessTier('dashboard', 'owner')).toBe('owner');
    expect(replayAccessTier('dashboard', 'receptionist')).toBe('receptionist');
    expect(replayAccessTier('provider', 'manager')).toBe('manager');
  });

  it('falls back to owner when a staff row has no role', () => {
    expect(replayAccessTier('dashboard', null)).toBe('owner');
    expect(replayAccessTier('dashboard', undefined)).toBe('owner');
  });
});

describe('RESCUE_CORPUS_SQL', () => {
  it('selects the rescue-dependent population with a deterministic truth', () => {
    // Two runs disagreeing about the target would make every comparison
    // meaningless, so the tie-break must not be positional.
    expect(RESCUE_CORPUS_SQL).toContain("action_changed_by = 'rescue'");
    expect(RESCUE_CORPUS_SQL).toContain('array_agg(action order by action)');
    expect(RESCUE_CORPUS_SQL).not.toMatch(/random\(\)/);
  });
});

describe('summarizeReplay', () => {
  const results = [
    outcome('a', 'OK', 4),
    outcome('b', 'OK', 1),
    outcome('c', 'wrong', 2),
    outcome('d', 'reject:not_executable(empty_plan,unresolved_notes)', 3),
    outcome('e', 'reject:not_executable(unresolved_notes)', 1),
  ];

  it('counts prompts and traces separately', () => {
    const s = summarizeReplay(results);
    expect(s.prompts).toBe(5);
    expect(s.promptsOk).toBe(2);
    expect(s.traces).toBe(11);
    expect(s.tracesOk).toBe(5);
  });

  it('buckets by verdict with the problem detail stripped', () => {
    // Otherwise every distinct combination of problem codes is its own bucket
    // and the table stops being readable.
    const s = summarizeReplay(results);
    const reject = s.buckets.find((b) => b.verdict === 'reject:not_executable');
    expect(reject).toEqual({
      verdict: 'reject:not_executable',
      prompts: 2,
      traces: 4,
    });
  });

  it('orders buckets by traces, heaviest first', () => {
    const s = summarizeReplay(results);
    const traces = s.buckets.map((b) => b.traces);
    expect([...traces].sort((a, b) => b - a)).toEqual(traces);
  });

  it('tallies problem codes across prompts', () => {
    const s = summarizeReplay(results);
    expect(s.problemCodes).toEqual([
      { code: 'unresolved_notes', count: 2 },
      { code: 'empty_plan', count: 1 },
    ]);
  });

  it('handles a run where nothing succeeded', () => {
    const s = summarizeReplay([outcome('a', 'wrong', 2)]);
    expect(s.promptsOk).toBe(0);
    expect(s.tracesOk).toBe(0);
  });
});

describe('replayChurn', () => {
  it('counts verdict changes and OK flips between two runs', () => {
    const a = [
      outcome('p1', 'OK'),
      outcome('p2', 'wrong'),
      outcome('p3', 'OK'),
    ];
    const b = [
      outcome('p1', 'OK'),
      outcome('p2', 'reject:not_executable'),
      outcome('p3', 'wrong'),
    ];
    expect(replayChurn(a, b)).toEqual({
      compared: 3,
      changed: 2,
      okFlips: 1,
    });
  });

  it('reports zero churn for a run against itself', () => {
    const a = [outcome('p1', 'OK'), outcome('p2', 'wrong')];
    expect(replayChurn(a, a)).toEqual({ compared: 2, changed: 0, okFlips: 0 });
  });

  it('compares only prompts present in both runs', () => {
    // A short second run must not read as churn — it would understate the noise
    // floor, which is the one number this exists to protect.
    const a = [outcome('p1', 'OK'), outcome('p2', 'wrong')];
    const b = [outcome('p1', 'wrong')];
    expect(replayChurn(a, b)).toEqual({ compared: 1, changed: 1, okFlips: 1 });
  });
});
