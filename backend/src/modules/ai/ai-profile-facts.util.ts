/**
 * AI-ROADMAP Phase 6 / §3.4 tier 3 — profile facts.
 *
 * §3.4 describes this tier as "durable prefs: default provider, locale, comms
 * prefs" living in "Postgres, keyed by user, permanent". Checking each of the
 * three named facts against what the database already holds says a new table is
 * the wrong shape for two of them and unnecessary for the third.
 *
 * ## locale is already stored
 *
 * `users.locale` exists. A second copy under an AI-owned table would be a
 * second source of truth for a value the platform already owns, and the two
 * would drift the first time someone changed it in the wrong place.
 *
 * ## default provider is derivable, and storing it would rot
 *
 * Measured against `bookings`: of 19 customers with 3 or more bookings,
 * **16 (84%) have only ever booked one provider**, averaging 1.32 distinct
 * providers. The preference is real — people have "their" stylist — but it is a
 * *fact about the booking history*, not an independent value. Persisting it
 * creates a cached aggregate that is wrong the moment the next booking lands,
 * and nothing would recompute it.
 *
 * (Sample caveat, stated because the number is small: 19 repeat customers in
 * this dataset. The 84% is a strong signal and matches the domain, but the
 * evidence threshold below is what actually protects against reading noise as
 * preference.)
 *
 * ## So this tier is a read model, not a table
 *
 * Facts are derived on demand and carry their evidence. The only thing that
 * would justify a table is a preference the user *states* and that cannot be
 * observed — and none of §3.4's three examples is that.
 */

export type ProfileFactSource =
  /** Observed from what the user actually did. */
  | 'derived'
  /** Stored because the user said so — the platform already owns these. */
  | 'declared';

export interface ProfileFact<T> {
  value: T;
  source: ProfileFactSource;
  /** How many observations back a derived fact. 0 for declared. */
  evidence: number;
  /** 0–1. Declared facts are 1; derived facts are a consistency ratio. */
  confidence: number;
}

/**
 * Minimum observations before a pattern counts as a preference.
 *
 * Three, matching the threshold the measurement used. Two bookings with one
 * provider is as likely to be availability as preference, and a "default"
 * inferred from a coincidence is worse than no default: it is wrong in a way
 * that looks personalised.
 */
export const MIN_EVIDENCE = 3;

/**
 * How consistent the observations must be.
 *
 * A customer who used one provider 4 times out of 7 has no default. 0.8 keeps
 * the 84%-of-repeat-customers group and excludes the genuinely mixed ones.
 */
export const MIN_CONSISTENCY = 0.8;

export interface ObservedBooking {
  employeeId: string | null;
  serviceId: string | null;
}

function dominant<T extends string>(
  values: readonly (T | null)[],
): ProfileFact<T> | null {
  const present = values.filter((v): v is T => Boolean(v));
  if (present.length < MIN_EVIDENCE) return null;

  const counts = new Map<T, number>();
  for (const v of present) counts.set(v, (counts.get(v) ?? 0) + 1);

  // Ties break on the alphabetically-first value so the output is stable, but a
  // tie cannot clear MIN_CONSISTENCY with more than one candidate anyway.
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of [...counts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  if (!best) return null;

  const consistency = bestCount / present.length;
  if (consistency < MIN_CONSISTENCY) return null;

  return {
    value: best,
    source: 'derived',
    evidence: present.length,
    confidence: Math.round(consistency * 100) / 100,
  };
}

export interface ProfileFacts {
  /** From `users.locale` — the platform already owns this. */
  locale: ProfileFact<string> | null;
  defaultProvider: ProfileFact<string> | null;
  usualService: ProfileFact<string> | null;
}

export function deriveProfileFacts(input: {
  bookings: readonly ObservedBooking[];
  /** Read from `users.locale`, not stored again here. */
  locale?: string | null;
}): ProfileFacts {
  return {
    locale: input.locale
      ? { value: input.locale, source: 'declared', evidence: 0, confidence: 1 }
      : null,
    defaultProvider: dominant(input.bookings.map((b) => b.employeeId)),
    usualService: dominant(input.bookings.map((b) => b.serviceId)),
  };
}

/**
 * Apply a profile default to a slot the user did not fill.
 *
 * The rule that matters: **an explicit value always wins, including an explicit
 * "anyone".** A user who says "book me with anyone" has expressed a preference —
 * the absence of a name is the answer, not a gap to fill — and quietly routing
 * them to their usual provider would override a stated choice with an inferred
 * one.
 *
 * Returns null rather than the fact when the default does not apply, so a
 * caller cannot mistake "no default" for "default not used".
 */
export function applyProfileDefault<T>(
  fact: ProfileFact<T> | null,
  explicit: { provided: boolean; value?: T },
): { value: T; usedDefault: boolean } | null {
  if (explicit.provided) {
    return explicit.value === undefined
      ? null
      : { value: explicit.value, usedDefault: false };
  }
  if (!fact) return null;
  return { value: fact.value, usedDefault: true };
}

/**
 * One line per fact, for the classifier context block.
 *
 * States the evidence, because a default the model treats as certain is how an
 * inferred preference becomes an unrequested booking. "usually books with X
 * (5 of 6 visits)" invites a confirmation; "prefers X" does not.
 */
export function renderProfileFacts(facts: ProfileFacts): string[] {
  const lines: string[] = [];
  if (facts.defaultProvider) {
    const f = facts.defaultProvider;
    lines.push(
      `usually books with provider ${f.value} (${Math.round(f.confidence * f.evidence)} of ${f.evidence} visits)`,
    );
  }
  if (facts.usualService) {
    const f = facts.usualService;
    lines.push(
      `usually books service ${f.value} (${Math.round(f.confidence * f.evidence)} of ${f.evidence} visits)`,
    );
  }
  if (facts.locale) lines.push(`locale ${facts.locale.value}`);
  return lines;
}
