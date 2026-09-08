/**
 * AI-ROADMAP Phase 4 — the re-parser ratchet.
 *
 * §46 built the one `EntityResolutionService`. Building it does not remove the
 * fourteen local re-parsers it replaces, and nothing stops a fifteenth: every
 * one of the seven `resolveServiceByName` copies was added by someone who
 * needed to match a service name and wrote the obvious four lines rather than
 * hunting for an existing helper. That is not carelessness, it is what happens
 * when the copy is easier to write than the import is to find.
 *
 * So this counts them and pins the count. The list may only **shrink**:
 *
 *   - a re-parser not in the manifest → a new copy; fail, and name the service
 *     to use instead.
 *   - a manifest entry that has disappeared → migrated; delete the entry. The
 *     gate fails until it is removed, so the number cannot be quietly padded.
 *
 * Modelled on §22's detector freeze ratchet, which is the mechanism that
 * actually stopped detector growth after two years of it.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Function names that re-implement resolution a call site should delegate.
 *
 * Deliberately a name list rather than a shape heuristic. "Any function that
 * calls `.toLowerCase().includes()`" would sweep in genuine string utilities
 * and turn the gate into something people disable; these names are the ones
 * measured as duplicated and disagreeing.
 */
const REPARSER_PATTERNS = [
  /function\s+(resolveServiceByName\w*)/g,
  /function\s+(resolveServiceIdByName\w*)/g,
  /function\s+(resolveServicesByName\w*)/g,
  /function\s+(resolveTomorrowDateKey\w*)/g,
  /function\s+(extractTimeSlotFromPrompt\w*)/g,
  /function\s+(resolveDateRange\w*)/g,
];

/**
 * The canonical implementations, exempt because the service delegates to them.
 *
 * `resolveDateRange` in `ai-orchestration.helpers.ts` was already
 * timezone-correct, so §32 extended it in place. Counting it as a re-parser
 * would demand deleting the very function the service wraps.
 */
const CANONICAL = new Set([
  'ai-orchestration.helpers.ts::resolveDateRange',
  // §185 — the surviving `resolveTomorrowDateKey`, hoisted into the datetime
  // util beside the primitives it composes. It matches the pattern because it
  // *is* the implementation, the same reason `resolveDateRange` above is
  // exempt: counting it would demand deleting the function the others now call.
  'ai-datetime-resolution.util.ts::resolveTomorrowDateKey',
]);

/**
 * Every local re-parser as of §46, each with what replaces it.
 *
 * The reasons are not decoration: a migration needs to know whether a call site
 * can adopt the service as a drop-in or whether adopting it is a behaviour
 * change (the resolver refuses where the old code guessed), because the second
 * kind needs the clarify path wired through the handler first.
 */
const KNOWN_REPARSERS: Record<string, string> = {
  // e2e-bug.367, 2026-08-17 (§185): both `resolveTomorrowDateKey` copies are
  // gone, hoisted into `ai-datetime-resolution.util.ts` beside the
  // `localCalendarDate` / `addCalendarDays` primitives they compose.
  //
  // Unlike the pair below, these two were byte-identical and both already
  // correct — e2e-bug.363 had been fixed in each. This was redundancy, not
  // divergence, and the reason to remove it is that the *next* fix would have
  // had two places to land and only one author. Neither original file could
  // host it: `ai-payments.util.ts` and `ai-compound-booking-context.util.ts`
  // import each other, so either choice deepened an existing cycle.
  //
  // e2e-bug.367, 2026-08-17 (§184/§185): `ai-clinic-lab-booking.util.ts`'s
  // `extractTimeSlotFromPrompt` is gone. It delegates to the canonical extractor
  // and is renamed `resolveClinicTimeSlotFromPrompt`, because it is no longer a
  // second parser — it is a clinic-local fallback (`morning`/`afternoon`/
  // `evening`) applied only when the canonical one declines.
  //
  // It was not merely a duplicate: both copies carried their own e2e-bug.364
  // fix, and this one's was weaker (`\b(am|pm)\b` cannot follow the period in
  // "p.m."), so "6:45 p.m." scheduled a lab collection at 06:45.
  // e2e-bug.367, 2026-08-08 (§112): the five byte-identical
  // `resolveServiceByName` copies are gone, collapsed into
  // `ai-legacy-service-match.util.ts::matchServiceByNameLegacy`. That is a pure
  // refactor — the behaviour is unchanged — so it does not discharge the
  // migration those entries described. What it does is turn five future edits
  // into one: adopting `EntityResolutionService.resolveService`, which refuses
  // where this guesses, is now a single call site to wire a clarify path
  // through instead of five.
  //
  // The two genuine variants below stay: they differ from each other and from
  // the five, and merging them would be a behaviour change wearing a refactor's
  // clothes.
  'ai-compare-services.logic.ts::resolveServiceByName':
    'variant with reverse-substring rule → EntityResolutionService.serviceOrClarify; behaviour change, it currently guesses',
  'ai-pick-provider-for-service.logic.ts::resolveServiceByName':
    'variant with reverse-substring rule → EntityResolutionService.serviceOrClarify; behaviour change, it currently guesses',
  'ai-customer-waitlist.logic.ts::resolveServiceIdByName':
    'async id lookup → EntityResolutionService.serviceOrClarify',
  'ai-structural-extractors.ts::extractTimeSlotFromPrompt':
    // §187 fixed the parsing (the meridiem pattern now has one home in
    // MERIDIEM_GROUP_SOURCE), so this is no longer a correctness gap. What is
    // left is a contract change: this returns string|null and guesses a bare
    // "at 8", where resolveTime reports ambiguity. Blocked on the same
    // guess-vs-clarify decision as the resolveServiceByName entries.
    'contract change → EntityResolutionService.resolveTime; it guesses where resolveTime would ask',
};

function findReparsers(): Set<string> {
  const dir = __dirname;
  const found = new Set<string>();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.ts') || file.includes('.spec.')) continue;
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const pattern of REPARSER_PATTERNS) {
      for (const match of src.matchAll(pattern)) {
        const key = `${file}::${match[1]}`;
        if (!CANONICAL.has(key)) found.add(key);
      }
    }
  }
  return found;
}

describe('re-parser ratchet', () => {
  const found = findReparsers();

  it('has no re-parser that is not in the manifest', () => {
    // A new local resolver. Use EntityResolutionService — it is injectable from
    // AiModule and refuses ambiguity instead of picking the first row.
    const unlisted = [...found].filter((k) => !(k in KNOWN_REPARSERS)).sort();
    expect(unlisted).toEqual([]);
  });

  it('has no manifest entry that has already been migrated', () => {
    // Keeps the list honest: a migrated entry must be deleted, so the count
    // cannot be padded to buy headroom for a new copy.
    const stale = Object.keys(KNOWN_REPARSERS)
      .filter((k) => !found.has(k))
      .sort();
    expect(stale).toEqual([]);
  });

  it('is not growing', () => {
    // The ratchet. 14 at §46; this number may go down and never up.
    expect(found.size).toBeLessThanOrEqual(14);
  });

  it('gives every entry a replacement, so migrating needs no archaeology', () => {
    for (const [key, reason] of Object.entries(KNOWN_REPARSERS)) {
      expect(reason.length).toBeGreaterThan(20);
      expect(`${key} ${reason}`).toMatch(
        /EntityResolutionService\.(serviceOrClarify|resolveDate|resolveTime|resolveRange)/,
      );
    }
  });

  it('exempts only the canonical implementations the service wraps', () => {
    // If this list grows, the gate is being weakened rather than the tree
    // improved.
    expect([...CANONICAL]).toEqual([
      'ai-orchestration.helpers.ts::resolveDateRange',
      'ai-datetime-resolution.util.ts::resolveTomorrowDateKey',
    ]);
  });
});
