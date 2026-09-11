/**
 * AI-ROADMAP Phase 6 / §3.4 tier 3 — profile facts.
 *
 * Measured against `bookings` before writing any of this: of 19 customers with
 * 3+ bookings, **16 (84%) have only ever used one provider**, averaging 1.32
 * distinct providers. The preference is real, which is why the thresholds below
 * exist — and why the fact is *derived* rather than stored, since a cached
 * aggregate would be wrong the moment the next booking lands.
 *
 * The property that matters most is the last describe block: an inferred
 * default must never override something the user actually said.
 */
import {
  applyProfileDefault,
  deriveProfileFacts,
  MIN_CONSISTENCY,
  MIN_EVIDENCE,
  renderProfileFacts,
  type ObservedBooking,
} from './ai-profile-facts.util.js';

const booking = (
  employeeId: string | null,
  serviceId: string | null = 's1',
): ObservedBooking => ({ employeeId, serviceId });

describe('deriveProfileFacts', () => {
  it('derives a default provider from consistent history', () => {
    // The 84% case: same provider every visit.
    const facts = deriveProfileFacts({
      bookings: [booking('e1'), booking('e1'), booking('e1')],
    });
    expect(facts.defaultProvider).toEqual({
      value: 'e1',
      source: 'derived',
      evidence: 3,
      confidence: 1,
    });
  });

  it('needs enough evidence before calling anything a preference', () => {
    // Two bookings with one provider is as likely to be availability as
    // preference, and a default inferred from a coincidence is worse than none:
    // it is wrong in a way that looks personalised.
    const facts = deriveProfileFacts({
      bookings: Array.from({ length: MIN_EVIDENCE - 1 }, () => booking('e1')),
    });
    expect(facts.defaultProvider).toBeNull();
  });

  it('refuses when the history is genuinely mixed', () => {
    // 4 of 7 is not a default.
    const facts = deriveProfileFacts({
      bookings: [
        booking('e1'),
        booking('e1'),
        booking('e1'),
        booking('e1'),
        booking('e2'),
        booking('e2'),
        booking('e3'),
      ],
    });
    expect(facts.defaultProvider).toBeNull();
  });

  it('accepts a strong-but-imperfect pattern', () => {
    // 5 of 6 = 0.83, above MIN_CONSISTENCY. Someone whose usual provider was
    // once unavailable still has a usual provider.
    const facts = deriveProfileFacts({
      bookings: [
        booking('e1'),
        booking('e1'),
        booking('e1'),
        booking('e1'),
        booking('e1'),
        booking('e2'),
      ],
    });
    expect(facts.defaultProvider?.value).toBe('e1');
    expect(facts.defaultProvider?.confidence).toBeGreaterThanOrEqual(
      MIN_CONSISTENCY,
    );
  });

  it('ignores bookings with no provider rather than counting them against', () => {
    // An unassigned booking is absence of evidence, not evidence of variety.
    const facts = deriveProfileFacts({
      bookings: [booking('e1'), booking('e1'), booking('e1'), booking(null)],
    });
    expect(facts.defaultProvider?.value).toBe('e1');
    expect(facts.defaultProvider?.evidence).toBe(3);
  });

  it('derives a usual service the same way', () => {
    const facts = deriveProfileFacts({
      bookings: [
        booking('e1', 'svc-a'),
        booking('e2', 'svc-a'),
        booking('e3', 'svc-a'),
      ],
    });
    expect(facts.usualService?.value).toBe('svc-a');
  });

  it('reads locale rather than storing a second copy', () => {
    // `users.locale` already exists; a second copy under an AI-owned table
    // would drift the first time someone changed it in the wrong place.
    const facts = deriveProfileFacts({ bookings: [], locale: 'hy' });
    expect(facts.locale).toEqual({
      value: 'hy',
      source: 'declared',
      evidence: 0,
      confidence: 1,
    });
  });

  it('has no facts for a new customer', () => {
    expect(deriveProfileFacts({ bookings: [] })).toEqual({
      locale: null,
      defaultProvider: null,
      usualService: null,
    });
  });
});

describe('applyProfileDefault — an inferred default never overrides a stated choice', () => {
  const fact = {
    value: 'e1',
    source: 'derived' as const,
    evidence: 5,
    confidence: 1,
  };

  it('fills a slot the user left empty', () => {
    expect(applyProfileDefault(fact, { provided: false })).toEqual({
      value: 'e1',
      usedDefault: true,
    });
  });

  it('does not override an explicit choice', () => {
    expect(applyProfileDefault(fact, { provided: true, value: 'e2' })).toEqual({
      value: 'e2',
      usedDefault: false,
    });
  });

  it('treats an explicit "anyone" as an answer, not a gap', () => {
    // "book me with anyone" IS a preference — the absence of a name is the
    // answer. Routing to the usual provider would override a stated choice with
    // an inferred one.
    expect(
      applyProfileDefault(fact, { provided: true, value: undefined }),
    ).toBeNull();
  });

  it('returns null when there is no default to apply', () => {
    // Distinct from "default not used", so a caller cannot conflate them.
    expect(applyProfileDefault(null, { provided: false })).toBeNull();
  });

  it('reports whether the default was used, so it can be surfaced', () => {
    const applied = applyProfileDefault(fact, { provided: false });
    expect(applied?.usedDefault).toBe(true);
  });
});

describe('renderProfileFacts', () => {
  it('states the evidence rather than asserting a preference', () => {
    // A default the model treats as certain is how an inferred preference
    // becomes an unrequested booking. "usually books with X (5 of 6 visits)"
    // invites a confirmation; "prefers X" does not.
    const lines = renderProfileFacts(
      deriveProfileFacts({
        bookings: [
          booking('e1'),
          booking('e1'),
          booking('e1'),
          booking('e1'),
          booking('e1'),
          booking('e2'),
        ],
      }),
    );
    expect(lines[0]).toContain('usually books with provider e1');
    expect(lines[0]).toContain('5 of 6 visits');
  });

  it('renders nothing for a customer with no history', () => {
    expect(renderProfileFacts(deriveProfileFacts({ bookings: [] }))).toEqual(
      [],
    );
  });

  it('includes locale when known', () => {
    const lines = renderProfileFacts(
      deriveProfileFacts({ bookings: [], locale: 'ru' }),
    );
    expect(lines).toContain('locale ru');
  });
});
