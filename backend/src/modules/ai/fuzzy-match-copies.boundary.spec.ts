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
  const INFLECTED: [string, string, string][] = [
    ['Կարո', 'Կարոյին գրանցիր', 'hy dative — "book Karo"'],
    ['Կարո', 'Կարոյի մոտ', 'hy genitive — "at Karo\'s"'],
    ['Иван', 'запиши Ивана', 'ru accusative — "book Ivan"'],
    ['Иван', 'к Ивану', 'ru dative — "to Ivan"'],
  ];

  it.each(INFLECTED.map((c) => [c[2], c] as const))(
    'export MISSES %s where the unfixed copy resolves it',
    (_label, [name, query]) => {
      expect(privateCopy(one(name), query)).toBeDefined();
      expect(fuzzyMatchByName(one(name), query)).toBeUndefined();
    },
  );

  it('the English control still works in both, so this is about morphology', () => {
    expect(privateCopy(one('Anna'), 'book Anna')?.id).toBe('e1');
    expect(fuzzyMatchByName(one('Anna'), 'book Anna')?.id).toBe('e1');
  });

  it('quantifies both directions so the swap is decided on evidence', () => {
    const lostByExport = INFLECTED.filter(
      ([n, q]) =>
        privateCopy(one(n), q) !== undefined &&
        fuzzyMatchByName(one(n), q) === undefined,
    );
    console.log(
      `[e2e-bug.447] the shared export loses ${lostByExport.length}/${INFLECTED.length} inflected hy/ru forms ` +
        `that the unfixed private copies still resolve:\n    ` +
        lostByExport.map(([, , label]) => label).join('\n    '),
    );
    expect(lostByExport).toHaveLength(INFLECTED.length);
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
