/**
 * AI-ROADMAP Phase 2 — paraphrase-invariance fixtures, generated.
 *
 * The existing paraphrase corpus (`ai-semantic-paraphrase-corpus.util.ts`,
 * acc-3.16) is hand-authored: five distinct phrasings per intent, in three
 * locales, written by a person. §2.2 demotes that approach — "large, perishable,
 * and mostly redundant" — because it scales as 110 × 5 × 3 and rots the moment a
 * command changes.
 *
 * These fixtures are *generated* instead: each `CommandSpec.examples` entry is
 * mechanically varied. Adding a command to a spec file adds its paraphrase
 * coverage automatically, and the coverage cannot drift from the command,
 * because it is derived from it.
 *
 * What this measures is narrow and deliberate: **surface-form invariance**. A
 * classifier that answers differently for "Add a category called Wellness" and
 * "add a category called wellness" is brittle in a way that needs no product
 * judgement to call a bug. That is the whole claim behind replacing 786 regex
 * detectors — this puts a number on it.
 *
 * What it deliberately does NOT do is invent semantic paraphrases ("book me in"
 * → "make an appointment"). Those need a human or a model to be trustworthy, and
 * a generated guess at meaning would produce fixtures that fail for the wrong
 * reason.
 */

export type ParaphraseStrictness =
  /**
   * Indisputably meaning-preserving: casing, whitespace, trailing punctuation.
   * A classifier that changes its answer here is wrong, with no argument
   * available. These are asserted absolutely.
   */
  | 'strict'
  /**
   * Ordinary ways people phrase the same request — politeness, filler, a
   * question mark. Meaning-preserving to any reader, but a detector written as
   * an imperative-only regex will miss them. Ratcheted rather than asserted at
   * zero, because the debt is real and pre-existing.
   */
  | 'natural';

export interface ParaphraseTransform {
  id: string;
  strictness: ParaphraseStrictness;
  /** Why this preserves meaning — the justification for asserting on it. */
  rationale: string;
  apply: (prompt: string) => string;
}

export const PARAPHRASE_TRANSFORMS: readonly ParaphraseTransform[] = [
  {
    id: 'lowercase',
    strictness: 'strict',
    rationale: 'Users type without capitals; case carries no intent.',
    apply: (p) => p.toLowerCase(),
  },
  {
    id: 'uppercase',
    strictness: 'strict',
    rationale: 'Shouting is still the same request.',
    apply: (p) => p.toUpperCase(),
  },
  {
    id: 'trailing_period',
    strictness: 'strict',
    rationale: 'Terminal punctuation is not part of the request.',
    apply: (p) => `${p}.`,
  },
  {
    id: 'surrounding_whitespace',
    strictness: 'strict',
    rationale: 'Copy-paste and mobile keyboards add stray whitespace.',
    apply: (p) => `  ${p}  `,
  },
  {
    id: 'double_spaces',
    strictness: 'strict',
    rationale: 'Double spaces between words change nothing.',
    apply: (p) => p.replace(/ /g, '  '),
  },
  {
    id: 'please_prefix',
    strictness: 'natural',
    rationale: 'Politeness is the commonest phrasing variation there is.',
    apply: (p) => `please ${p}`,
  },
  {
    id: 'can_you_prefix',
    strictness: 'natural',
    rationale: 'Phrasing a command as a request is normal in chat.',
    apply: (p) => `can you ${p}`,
  },
  {
    id: 'i_need_to_prefix',
    strictness: 'natural',
    rationale: 'Stating the need rather than the imperative.',
    apply: (p) => `i need to ${p}`,
  },
  {
    id: 'just_filler',
    strictness: 'natural',
    rationale: 'Filler words carry no intent.',
    apply: (p) => `just ${p}`,
  },
  {
    id: 'question_mark',
    strictness: 'natural',
    rationale: 'A request typed as a question is the same request.',
    apply: (p) => `${p}?`,
  },
];

export interface ParaphraseCase {
  /** Canonical `domain.verb` id of the command the phrasing must still reach. */
  command: string;
  /** Legacy flat action, which is what the detector layer speaks. */
  alias: string;
  /** The `CommandSpec.examples` entry this was generated from. */
  base: string;
  /** The varied phrasing. */
  variant: string;
  transformId: string;
  strictness: ParaphraseStrictness;
}

export interface ParaphraseSourceSpec {
  id: string;
  aliases: readonly string[];
  examples: readonly string[];
}

/**
 * One case per (example × transform). The base example itself is not a case:
 * whether the base is recognised at all is a *coverage* question, and conflating
 * it with invariance would report a command with no detector as brittle rather
 * than as uncovered.
 */
export function buildParaphraseCases(
  specs: readonly ParaphraseSourceSpec[],
  transforms: readonly ParaphraseTransform[] = PARAPHRASE_TRANSFORMS,
): ParaphraseCase[] {
  const cases: ParaphraseCase[] = [];
  for (const spec of specs) {
    const alias = spec.aliases[0];
    if (!alias) continue;
    for (const base of spec.examples) {
      for (const transform of transforms) {
        const variant = transform.apply(base);
        // A transform that changed nothing proves nothing.
        if (variant === base) continue;
        cases.push({
          command: spec.id,
          alias,
          base,
          variant,
          transformId: transform.id,
          strictness: transform.strictness,
        });
      }
    }
  }
  return cases;
}

export interface ParaphraseBreak {
  command: string;
  base: string;
  variant: string;
  transformId: string;
  strictness: ParaphraseStrictness;
}

/**
 * Run the cases for one command against a boolean recogniser.
 *
 * `baseRecognised: false` means the recogniser never matched the original
 * example, so there is nothing to be invariant about — reported separately as
 * `uncovered` rather than counted as breakage.
 */
export function checkParaphraseInvariance(
  cases: readonly ParaphraseCase[],
  recognise: (prompt: string) => boolean,
): { breaks: ParaphraseBreak[]; uncoveredBases: string[]; checked: number } {
  const breaks: ParaphraseBreak[] = [];
  const uncoveredBases = new Set<string>();
  let checked = 0;

  for (const c of cases) {
    if (!recognise(c.base)) {
      uncoveredBases.add(c.base);
      continue;
    }
    checked += 1;
    if (!recognise(c.variant)) {
      breaks.push({
        command: c.command,
        base: c.base,
        variant: c.variant,
        transformId: c.transformId,
        strictness: c.strictness,
      });
    }
  }

  return { breaks, uncoveredBases: [...uncoveredBases].sort(), checked };
}

/** Breaks grouped by transform, so the worst phrasing variation is obvious. */
export function summarizeBreaksByTransform(
  breaks: readonly ParaphraseBreak[],
): { transformId: string; strictness: ParaphraseStrictness; count: number }[] {
  const byTransform = new Map<
    string,
    { strictness: ParaphraseStrictness; count: number }
  >();
  for (const b of breaks) {
    const slot = byTransform.get(b.transformId) ?? {
      strictness: b.strictness,
      count: 0,
    };
    slot.count += 1;
    byTransform.set(b.transformId, slot);
  }
  return [...byTransform.entries()]
    .map(([transformId, v]) => ({ transformId, ...v }))
    .sort(
      (a, b) => b.count - a.count || a.transformId.localeCompare(b.transformId),
    );
}
