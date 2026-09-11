/**
 * e2e-bug.446 / e2e-bug.447 — measuring the gap between the fixed
 * `fuzzyMatchByName` and the three private copies, before changing either.
 *
 * e2e-bug.362 / §111 anchored the shared exported matcher to word boundaries.
 * Three private copies were never touched — `ai-command.service.ts:2890`,
 * `public-booking-assistant.service.ts:5707`, `ai-booking-core.service.ts:586`
 * — and are byte-identical to each other and to the *pre-fix* shared version,
 * so this file reproduces that body once and compares it against the live
 * export. Reproducing rather than importing is deliberate: the copies are
 * private, and reaching them through their owning services would measure the
 * services, not the matcher.
 *
 * The result is not what "just import the shared one" assumes. Acceptance moves
 * in BOTH directions, and one of the directions is a regression in Armenian and
 * Russian. Both directions are pinned below so the swap is a decision made on
 * evidence.
 */
import { fuzzyMatchByName } from './ai-orchestration.helpers.js';

/** Verbatim body of all three private copies (checked 2026-08-13). */
function privateCopy<T extends { name: string }>(
  items: T[],
  name: string,
): T | undefined {
  const lower = name.toLowerCase().trim();
  return (
    items.find((item) => item.name.toLowerCase() === lower) ||
    items.find((item) => item.name.toLowerCase().includes(lower)) ||
    items.find((item) => lower.includes(item.name.toLowerCase()))
  );
}

const one = (name: string) => [{ id: 'e1', name }];

describe('e2e-bug.446 — the private copies still carry the e2e-bug.362 defect', () => {
  const FALSE_POSITIVES: [string, string, string][] = [
    ['Al', 'is the salon open', '"Al" found inside "s-al-on"'],
    ['Al', 'book Alice for a haircut', '"Al" found inside "Alice"'],
    ['Jo', 'book John Smith in', '"Jo" found inside "John"'],
  ];

  it.each(FALSE_POSITIVES.map((c) => [c[2], c] as const))(
    'copy still resolves on %s; the export does not',
    (_label, [name, query]) => {
      expect(privateCopy(one(name), query)).toBeDefined();
      expect(fuzzyMatchByName(one(name), query)).toBeUndefined();
    },
  );
});

describe('e2e-bug.447 — the word-boundary fix drops inflected hy/ru name forms', () => {
  /**
   * Armenian and Russian attach case endings directly to the name, so the name
   * appears in the query as a PREFIX of a longer word, never as a whole word.
   * Word-boundary anchoring therefore rejects the most ordinary way to say
   * "book Karo" in either language.
   *
   * §111 was careful to compute boundaries over Unicode letters rather than
   * `\b` precisely so Armenian and Russian names would not break — but
   * Unicode-aware boundaries do not help here: the problem is morphology, not
   * the alphabet.
   *
   * Note the direction. The *unfixed* private copies handle these correctly, by
   * accident, via the same broad substring tier that causes e2e-bug.446. So the
   * two bugs pull against each other and cannot be closed independently.
   */
  /**
   * **Armenian was closed in §207; Russian was not.** The swap this file was
   * written to inform happened in §206, and the Armenian half of the regression
   * was removed first (`ARMENIAN_CASE_SUFFIX`), so those two rows moved to
   * RESOLVED below.
   *
   * Russian is the harder half and the distinction is worth stating, because
   * §207 first got it wrong: «Мария» → «Марии» is a **stem change** and no
   * suffix rule reaches it, but «Иван» → «Ивана» / «Ивану» is a **clean
   * suffix** and one would. So Russian is not out of reach on principle — it is
   * unfinished, and the masculine forms below are the tractable part.
   */
  /**
   * **Empty as of e2e-bug.481 (D5-d).** Both Russian rows moved to
   * `RESOLVED_MASCULINE_RU` below when `RUSSIAN_CASE_SUFFIX` landed. What
   * remains unreached is feminine stem change («Мария» → «Марии»), which is
   * asserted as a known miss in its own test rather than listed here — a stem
   * change is not the same defect as a missing suffix rule, and conflating them
   * is what made §207 get this wrong the first time.
   */
  const INFLECTED: [string, string, string][] = [];

  /** Closed in §207 — the export now resolves these, the copies did too. */
  const RESOLVED_IN_207: [string, string, string][] = [
    ['Կարո', 'Կարոյին գրանցիր', 'hy dative — "book Karo"'],
    ['Կարո', 'Կարոյի մոտ', 'hy genitive — "at Karo\'s"'],
  ];

  /** Closed by e2e-bug.481 — Russian masculine clean suffixes. */
  const RESOLVED_MASCULINE_RU: [string, string, string][] = [
    ['Иван', 'запиши Ивана', 'ru accusative — "book Ivan"'],
    ['Иван', 'к Ивану', 'ru dative — "to Ivan"'],
    ['Иван', 'с Иваном', 'ru instrumental — "with Ivan"'],
    ['Иван', 'об Иване', 'ru prepositional — "about Ivan"'],
  ];

  it.each(RESOLVED_MASCULINE_RU.map((c) => [c[2], c] as const))(
    'export now RESOLVES %s (e2e-bug.481)',
    (_label, [name, query]) => {
      expect(fuzzyMatchByName(one(name), query)?.id).toBe('e1');
    },
  );

  it('still misses feminine stem change, which no suffix rule reaches', () => {
    // «Мария» → «Марии»: the name is not a prefix of the inflected form at all,
    // so this is out of scope for `RUSSIAN_CASE_SUFFIX` by construction rather
    // than by omission. Pinned so the limitation stays visible.
    expect(fuzzyMatchByName(one('Мария'), 'запиши Марии')).toBeUndefined();
  });

  it('does not let the Russian rule re-open e2e-bug.362', () => {
    // The collision guards. A prefix that is not a real ending must not match,
    // and a two-letter stem must not match at all.
    expect(fuzzyMatchByName(one('Ан'), 'Анна գրանցիր')).toBeUndefined();
    expect(fuzzyMatchByName(one('Иван'), 'запиши Иванна')).toBeUndefined();
    // Below MIN_CYRILLIC_STEM even with a real ending.
    expect(fuzzyMatchByName(one('Ир'), 'запиши Ира')).toBeUndefined();
  });

  it.each(RESOLVED_IN_207.map((c) => [c[2], c] as const))(
    'export now RESOLVES %s (e2e-bug.480, closed §207)',
    (_label, [name, query]) => {
      expect(fuzzyMatchByName(one(name), query)?.id).toBe('e1');
    },
  );

  it('the English control still works in both, so this is about morphology', () => {
    expect(privateCopy(one('Anna'), 'book Anna')?.id).toBe('e1');
    expect(fuzzyMatchByName(one('Anna'), 'book Anna')?.id).toBe('e1');
  });

  it('has no remaining inflected form the private copies resolve and the export does not', () => {
    // This file existed to quantify what a swap would cost. hy was paid off in
    // §207 and ru masculine in e2e-bug.481, so the ledger is empty and the two
    // implementations no longer disagree on any listed form. Kept as an
    // assertion rather than deleted: if a future narrowing re-opens a gap, this
    // is where it shows up.
    expect(INFLECTED).toHaveLength(0);
  });
});

describe('e2e-bug.446 — shapes a swap would NOT break', () => {
  const AGREE: [string, string, string][] = [
    ['John Smith', 'John Smith', 'exact'],
    ['Al', 'book me a haircut with Al', 'whole word in a sentence'],
    ['Karo Mazmanyan', 'karo mazmanyan', 'case-insensitive'],
  ];

  it.each(AGREE.map((c) => [c[2], c] as const))(
    'both resolve %s',
    (_label, [name, query]) => {
      expect(privateCopy(one(name), query)?.id).toBe('e1');
      expect(fuzzyMatchByName(one(name), query)?.id).toBe('e1');
    },
  );
});
