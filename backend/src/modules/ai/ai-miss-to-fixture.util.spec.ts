/**
 * AI-ROADMAP Phase 9 — a confirmed miss becomes an example and an eval case.
 *
 * The parenthesis in the roadmap item is the point: "**never** a new regex".
 * The historical response to a miss was another `is*Prompt` detector, which is
 * how the tree reached 790 of them. These tests pin the two things that stop
 * the corpus rotting instead: what gets in, and what gets rejected.
 */
import {
  buildMissCaseId,
  buildMissFixtureBatch,
  buildMissFixtures,
  findRegexShapedFixes,
  slugifyPrompt,
  type ConfirmedMiss,
} from './ai-miss-to-fixture.util.js';
import type { MissCandidate } from './ai-miss-mining.util.js';

const candidate = (overrides: Partial<MissCandidate> = {}): MissCandidate => ({
  signal: 'rephrase_retry',
  traceId: 't1',
  action: 'check_availability',
  prompt: 'is anyone free for a massage tomorrow',
  evidenceTraceId: 't2',
  evidencePrompt: 'which providers do massage tomorrow',
  similarity: 0.6,
  ...overrides,
});

const miss = (overrides: Partial<ConfirmedMiss> = {}): ConfirmedMiss => ({
  candidate: candidate(),
  expectedAction: 'check_providers_for_service',
  surface: 'customer',
  ...overrides,
});

describe('slugifyPrompt', () => {
  it('makes a stable, readable slug', () => {
    expect(slugifyPrompt('Cancel my BOOKING now!')).toBe(
      'cancel-my-booking-now',
    );
  });

  it('caps the length so ids stay usable', () => {
    expect(
      slugifyPrompt('one two three four five six seven eight').split('-'),
    ).toHaveLength(6);
  });
});

describe('buildMissFixtures', () => {
  it('produces an example and an eval case from one miss', () => {
    const { example, evalCase } = buildMissFixtures(miss());
    expect(example).toBe('is anyone free for a massage tomorrow');
    expect(evalCase).toEqual({
      id: 'miss-check_providers_for_service-is-anyone-free-for-a-massage',
      prompt: 'is anyone free for a massage tomorrow',
      surface: 'customer',
      expect: { action: 'check_providers_for_service' },
    });
  });

  it('keeps the phrasing that FAILED, not the one that worked', () => {
    // The rewording already succeeds; an eval case for it would pass on day one
    // and prove nothing. The failing phrasing is the one worth pinning.
    expect(buildMissFixtures(miss()).example).toBe(
      'is anyone free for a massage tomorrow',
    );
  });

  it('can be told to use the successful rewording instead', () => {
    const { example } = buildMissFixtures(miss({ use: 'evidence' }));
    expect(example).toBe('which providers do massage tomorrow');
  });

  it('asserts only the action', () => {
    // A miss says "this phrasing reached the wrong command". It says nothing
    // about parameters, and inventing param expectations would create a golden
    // nobody verified.
    expect(Object.keys(buildMissFixtures(miss()).evalCase.expect)).toEqual([
      'action',
    ]);
  });

  it('carries the locale when one is known', () => {
    expect(buildMissFixtures(miss({ locale: 'hy' })).evalCase.locale).toBe(
      'hy',
    );
  });

  it('omits locale rather than defaulting to English', () => {
    expect(buildMissFixtures(miss()).evalCase).not.toHaveProperty('locale');
  });

  it('gives the same miss the same id twice', () => {
    // Re-running the miner must not create duplicate cases.
    expect(buildMissCaseId(miss())).toBe(buildMissCaseId(miss()));
  });
});

describe('buildMissFixtureBatch', () => {
  it('groups examples by the command whose spec should gain them', () => {
    const batch = buildMissFixtureBatch([
      miss(),
      miss({
        candidate: candidate({ prompt: 'who can do a facial on friday' }),
      }),
    ]);
    expect(batch.examplesByCommand).toEqual({
      check_providers_for_service: [
        'is anyone free for a massage tomorrow',
        'who can do a facial on friday',
      ],
    });
  });

  describe('rejections that protect the corpus', () => {
    it('drops a prompt already in the corpus', () => {
      // A duplicate golden inflates an intent's apparent coverage without
      // testing anything new — and §42 gates propose-only on case count.
      const batch = buildMissFixtureBatch(
        [miss()],
        new Set(['Is Anyone Free For A Massage Tomorrow']),
      );
      expect(batch.fixtures).toEqual([]);
      expect(batch.skipped[0].reason).toContain('already in the corpus');
    });

    it('drops duplicates within the same batch', () => {
      const batch = buildMissFixtureBatch([miss(), miss()]);
      expect(batch.fixtures).toHaveLength(1);
    });

    it('drops a prompt too short to carry an intent', () => {
      // "yes" is a real trace prompt. As a standalone eval case it asserts that
      // three characters mean a command.
      const batch = buildMissFixtureBatch([
        miss({ candidate: candidate({ prompt: 'yes' }) }),
      ]);
      expect(batch.fixtures).toEqual([]);
      expect(batch.skipped[0].reason).toContain('too short');
    });

    it('drops a miss whose expected action is the one that already ran', () => {
      // Not a miss. Accepting it would encode the failure as correct.
      const batch = buildMissFixtureBatch([
        miss({ expectedAction: 'check_availability' }),
      ]);
      expect(batch.fixtures).toEqual([]);
      expect(batch.skipped[0].reason).toContain('already ran');
    });

    it('reports what it skipped rather than silently dropping it', () => {
      const batch = buildMissFixtureBatch([
        miss({ candidate: candidate({ prompt: 'ok' }) }),
      ]);
      expect(batch.skipped).toHaveLength(1);
      expect(batch.skipped[0].prompt).toBe('ok');
    });
  });

  it('handles an empty batch', () => {
    expect(buildMissFixtureBatch([])).toEqual({
      fixtures: [],
      examplesByCommand: {},
      skipped: [],
    });
  });
});

describe('findRegexShapedFixes — working agreement 6', () => {
  it('flags a new detector', () => {
    // The habit this loop exists to replace. §22's ratchet would reject it
    // anyway; this says *why* rather than just "the count went up".
    expect(
      findRegexShapedFixes(
        // Assembled rather than written out: §22's freeze ratchet counts
        // `export function is*Prompt` across the whole tree by raw text, and a
        // literal here would register this test file as an 791st detector.
        // It did, on the first run — which is the ratchet working.
        `export ${'function'} isCheckProvidersPrompt(p: string) { return true; }`,
      ),
    ).toContain('declares a new is*Prompt detector');
  });

  it('flags a regular expression', () => {
    expect(
      findRegexShapedFixes('const CUE = new RegExp("who can do");'),
    ).toContain('contains a regular expression');
  });

  it('passes a fix that is data', () => {
    // The whole point: examples and eval cases are data, so the loop cannot
    // emit a detector by construction.
    const { example, evalCase } = buildMissFixtures(miss());
    expect(findRegexShapedFixes(JSON.stringify({ example, evalCase }))).toEqual(
      [],
    );
  });
});
