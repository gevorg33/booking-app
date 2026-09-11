/**
 * AI-ROADMAP Phase 4 — entity resolution with confidence.
 *
 * §7 working agreement 5: "Below-threshold entity resolution clarifies; it never
 * guesses." These tests are written against the two ways the current resolvers
 * break that: returning a bare entity with no confidence, and returning the
 * first array element when several candidates match equally.
 */
import {
  DEFAULT_RESOLUTION_THRESHOLD,
  normalizeEntityName,
  resolveEntities,
  resolveEntity,
  TIER_CONFIDENCE,
} from './ai-entity-resolution.util.js';

const EMPLOYEES = [
  { id: 'e1', name: 'John Smith' },
  { id: 'e2', name: 'Mary Poppins' },
  { id: 'e3', name: 'Karo Mazmanyan' },
];

describe('normalizeEntityName', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normalizeEntityName("  John   O'Brien-Smith.  ")).toBe(
      'john o brien smith',
    );
  });

  it('does not strip accents', () => {
    // "Renée" and "Renee" are plausibly two different people. Merging them
    // silently is the same class of error as a silent pick.
    expect(normalizeEntityName('Renée')).not.toBe(normalizeEntityName('Renee'));
  });
});

describe('resolveEntity', () => {
  it('resolves an exact name at full confidence', () => {
    const r = resolveEntity(EMPLOYEES, 'John Smith');
    expect(r).toMatchObject({
      status: 'resolved',
      confidence: 1,
      tier: 'exact',
      clarification: null,
    });
    expect(r.match?.id).toBe('e1');
  });

  it('resolves a first name as a whole token', () => {
    const r = resolveEntity(EMPLOYEES, 'john');
    expect(r.status).toBe('resolved');
    expect(r.tier).toBe('full_token');
    expect(r.match?.id).toBe('e1');
  });

  it('reports not_found with a clarify line when nothing matches', () => {
    const r = resolveEntity(EMPLOYEES, 'Zebediah');
    expect(r.status).toBe('not_found');
    expect(r.match).toBeNull();
    expect(r.clarification).toContain('Zebediah');
  });

  describe('never silently picks', () => {
    it('refuses two customers with the same name', () => {
      // The failure the current `.find(...)` cascade cannot even detect: the
      // winner is whichever row the database returned first.
      const r = resolveEntity(
        [
          { id: 'c1', name: 'John Smith' },
          { id: 'c2', name: 'John Smith' },
        ],
        'John Smith',
      );
      expect(r.status).toBe('ambiguous');
      expect(r.match).toBeNull();
      expect(r.candidates.map((c) => c.id)).toEqual(['c1', 'c2']);
      expect(r.clarification).toContain('Which');
    });

    it('refuses two different people who match the query equally', () => {
      const r = resolveEntity(
        [
          { id: 'e1', name: 'John Smith' },
          { id: 'e2', name: 'John Baker' },
        ],
        'John',
      );
      expect(r.status).toBe('ambiguous');
      expect(r.candidates).toHaveLength(2);
    });

    it('checks ambiguity before confidence, because a tie can be maximally confident', () => {
      // Two exact matches score 1.0. Confidence alone would wave them through,
      // which is why the tie check comes first.
      const r = resolveEntity(
        [
          { id: 'a', name: 'Massage' },
          { id: 'b', name: 'Massage' },
        ],
        'Massage',
      );
      expect(r.confidence).toBe(1);
      expect(r.status).toBe('ambiguous');
    });

    it('is not confused by the same entity appearing twice', () => {
      const r = resolveEntity(
        [
          { id: 'e1', name: 'John Smith' },
          { id: 'e1', name: 'John Smith' },
        ],
        'John Smith',
      );
      expect(r.status).toBe('resolved');
    });

    it('prefers the stronger tier rather than treating all matches as equal', () => {
      // "John Smith" exactly matches e1 and is *contained by* nothing else;
      // a weaker match on another candidate must not create an ambiguity.
      const r = resolveEntity(
        [
          { id: 'e1', name: 'John' },
          { id: 'e2', name: 'John Smith' },
        ],
        'John Smith',
      );
      expect(r.status).toBe('resolved');
      expect(r.match?.id).toBe('e2');
      expect(r.tier).toBe('exact');
    });
  });

  describe('the dangerous tier', () => {
    it('refuses a match where the query merely contains the name', () => {
      // `fuzzyMatchByName` has `items.find(i => lower.includes(i.name))`, so a
      // prompt about "John Smith" resolves to an employee called "Jo".
      const r = resolveEntity([{ id: 'e9', name: 'Jo' }], 'John Smith');
      expect(r.tier).toBe('query_contains');
      expect(r.confidence).toBeLessThan(DEFAULT_RESOLUTION_THRESHOLD);
      expect(r.status).toBe('not_found');
      expect(r.clarification).toBe('Did you mean Jo?');
    });

    it('still surfaces the near-miss so the caller can offer it', () => {
      const r = resolveEntity([{ id: 'e9', name: 'Jo' }], 'John Smith');
      expect(r.candidates.map((c) => c.id)).toEqual(['e9']);
    });

    it('can be accepted deliberately by lowering the threshold', () => {
      const r = resolveEntity([{ id: 'e9', name: 'Jo' }], 'John Smith', {
        threshold: 0.3,
      });
      expect(r.status).toBe('resolved');
    });
  });

  describe('confidence tiers', () => {
    it('orders strictly from exact down to query_contains', () => {
      const order = [
        TIER_CONFIDENCE.exact,
        TIER_CONFIDENCE.full_token,
        TIER_CONFIDENCE.prefix,
        TIER_CONFIDENCE.contains,
        TIER_CONFIDENCE.query_contains,
      ];
      expect(order).toEqual([...order].sort((a, b) => b - a));
    });

    it('puts prefix above and contains below the default threshold', () => {
      // The line between "Jo" → "Johanna" (offer it) and "smith" → "Smithson"
      // (do not act on it) is the threshold's whole job.
      expect(TIER_CONFIDENCE.prefix).toBeGreaterThanOrEqual(
        DEFAULT_RESOLUTION_THRESHOLD,
      );
      expect(TIER_CONFIDENCE.contains).toBeLessThan(
        DEFAULT_RESOLUTION_THRESHOLD,
      );
    });
  });

  it('names the entity type in its clarify question', () => {
    const r = resolveEntity(EMPLOYEES, 'Zebediah', { entityLabel: 'provider' });
    expect(r.clarification).toContain('provider');
  });
});

describe('resolveEntities', () => {
  it('reports names it could not resolve instead of dropping them', () => {
    // `resolveEmployees` drops unmatched names, so "cancel for John and Mary"
    // with an unknown Mary quietly becomes "cancel for John".
    const { resolved, unresolved } = resolveEntities(EMPLOYEES, [
      'John Smith',
      'Zebediah',
    ]);
    expect(resolved.map((e) => e.id)).toEqual(['e1']);
    expect(unresolved.map((u) => u.query)).toEqual(['Zebediah']);
  });

  it('reports an ambiguous name rather than resolving the rest silently', () => {
    const { resolved, unresolved } = resolveEntities(
      [
        { id: 'c1', name: 'John Smith' },
        { id: 'c2', name: 'John Smith' },
        { id: 'c3', name: 'Mary Poppins' },
      ],
      ['John Smith', 'Mary Poppins'],
    );
    expect(resolved.map((c) => c.id)).toEqual(['c3']);
    expect(unresolved[0].result.status).toBe('ambiguous');
  });

  it('de-duplicates when two queries resolve to the same entity', () => {
    const { resolved } = resolveEntities(EMPLOYEES, ['John Smith', 'john']);
    expect(resolved).toHaveLength(1);
  });

  it('returns empty results for no queries', () => {
    expect(resolveEntities(EMPLOYEES, [])).toEqual({
      resolved: [],
      unresolved: [],
    });
  });
});
