/**
 * AI-ROADMAP Phase 4 — what the single resolver changes, measured.
 *
 * A new resolver is only worth adopting if the old one is actually wrong, so
 * this drives the live `fuzzyMatchByName` and the new `resolveEntity` over the
 * same inputs and records where they disagree.
 *
 * The disagreements are not hypothetical: each case below is a shape the
 * existing five-tier cascade returns a confident-looking entity for, with no
 * signal to the caller that it guessed.
 */
import { fuzzyMatchByName } from './ai-orchestration.helpers.js';
import { resolveEntity } from './ai-entity-resolution.util.js';

interface Case {
  what: string;
  candidates: { id: string; name: string }[];
  query: string;
  /** Why the old answer is unsafe. */
  why: string;
}

const SILENT_PICKS: Case[] = [
  {
    what: 'two people with the same name',
    candidates: [
      { id: 'c1', name: 'John Smith' },
      { id: 'c2', name: 'John Smith' },
    ],
    query: 'John Smith',
    why: 'picks whichever row the database returned first',
  },
  {
    what: 'two people sharing a first name',
    candidates: [
      { id: 'e1', name: 'John Smith' },
      { id: 'e2', name: 'John Baker' },
    ],
    query: 'John',
    why: 'picks the first, and the other John is never mentioned',
  },
  // REMOVED 2026-08-08 (e2e-bug.362, §111): 'the query merely containing a short
  // name'. `fuzzyMatchByName`'s substring tiers are now anchored to word
  // boundaries, so a query for "John Smith" no longer resolves to an employee
  // "Jo", and "is the salon open" no longer resolves to "Al". The old matcher
  // returns `undefined` for that shape, which breaks this list's premise — every
  // entry here asserts the old matcher *does* pick — so it belongs in
  // `ai-fuzzy-match-boundary.spec.ts` instead, where it is pinned as fixed.
  //
  // The three that remain are ties, which word boundaries cannot help with:
  // they need `resolveEntity`'s "ask, never pick", i.e. the §29 migration
  // (e2e-bug.367).
  {
    what: 'two services sharing a word',
    candidates: [
      { id: 's1', name: 'Deep Tissue Massage' },
      { id: 's2', name: 'Swedish Massage' },
    ],
    query: 'massage',
    why: 'books one of two services at a different price, silently',
  },
];

describe('AI-ROADMAP Phase 4 — resolver comparison', () => {
  describe('cases where the current matcher picks silently', () => {
    it.each(SILENT_PICKS.map((c) => [c.what, c] as const))(
      '%s',
      (_what, testCase) => {
        const old = fuzzyMatchByName(testCase.candidates, testCase.query);
        const next = resolveEntity(testCase.candidates, testCase.query);

        // The old matcher returns an entity with no way to know it guessed.
        expect(old).toBeDefined();
        // The new one refuses and says why.
        expect(next.status).not.toBe('resolved');
        expect(next.match).toBeNull();
        expect(next.clarification).toBeTruthy();
      },
    );

    it('records the count so the change is quantified, not asserted', () => {
      const refused = SILENT_PICKS.filter((c) => {
        const old = fuzzyMatchByName(c.candidates, c.query);
        const next = resolveEntity(c.candidates, c.query);
        return old !== undefined && next.status !== 'resolved';
      });

      console.log(
        `[AI-ROADMAP resolution] ${refused.length}/${SILENT_PICKS.length} silent-pick shapes now clarify instead:\n    ` +
          refused.map((c) => `${c.what} — ${c.why}`).join('\n    '),
      );
      expect(refused).toHaveLength(SILENT_PICKS.length);
    });
  });

  describe('cases where both agree, so adoption is not a behaviour change', () => {
    const AGREE = [
      { candidates: [{ id: 'e1', name: 'John Smith' }], query: 'John Smith' },
      { candidates: [{ id: 'e1', name: 'John Smith' }], query: 'john' },
      { candidates: [{ id: 'e1', name: 'Karo Mazmanyan' }], query: 'Karo' },
    ];

    it.each(AGREE.map((c, i) => [i, c] as const))(
      'unambiguous match #%i resolves the same entity',
      (_i, c) => {
        const old = fuzzyMatchByName(c.candidates, c.query);
        const next = resolveEntity(c.candidates, c.query);
        expect(next.status).toBe('resolved');
        expect(next.match?.id).toBe(old?.id);
      },
    );

    it('both find nothing when nothing matches', () => {
      const candidates = [{ id: 'e1', name: 'John Smith' }];
      expect(fuzzyMatchByName(candidates, 'Zebediah')).toBeUndefined();
      expect(resolveEntity(candidates, 'Zebediah').status).toBe('not_found');
    });
  });
});
