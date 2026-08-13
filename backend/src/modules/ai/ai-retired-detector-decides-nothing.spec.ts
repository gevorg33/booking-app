/**
 * tech-debt A2 / e2e-bug.394 — the exit criterion, made measurable.
 *
 * ## The ticket's dilemma
 *
 * Phase 8 says "bulk-delete the slice's `legacy_paraphrase` detectors". They
 * cannot be deleted: the 15 `tour`/`guide` matchers have ~130 references across
 * 31 files, and most are *other* detectors using them as negative guards —
 * `if (isListTourCalendarWeekPrompt(p)) return null;` — so that non-tour
 * commands do not fire on tour prompts. Delete the predicate and every one of
 * those commands starts answering tour questions.
 *
 * A2 offered two ways out: split each detector's matcher from its guard use, or
 * **rewrite the exit criterion to "no detector may decide an action"**, which is
 * what §93's lock already achieves.
 *
 * ## Counting first settled it
 *
 * Every reference, classified:
 *
 * | kind | count |
 * |---|---|
 * | imports / re-exports | 47 |
 * | definitions | 15 |
 * | **declines** (`if (isX(p)) return null` and negated param guards) | **71** |
 * | completion checks (which fields are still missing) | 2 |
 * | dead (`isExplainTourServicesPrompt(p) ? [] : []`) | 1 |
 * | **routing — a call whose true result produces an action** | **0** |
 *
 * Zero. Including inside `ai-intent-rescue.service.ts`, the only place that can
 * change an action at all: all ten of its references are an import or a
 * `return null`. The criterion is not something to work towards; it is already
 * true, and was simply never asserted.
 *
 * ## What this file pins
 *
 * That the rescue service may only ever *decline* on these detectors. It is a
 * source-text check rather than a behavioural one deliberately: the property is
 * "no code path exists", and a behavioural test can only sample the paths it
 * thought to try.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import inventory from './ai-command-inventory.json';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { RETIRED_DETECTOR_DOMAINS } from './ai-planner-route.util.js';

type InventoryRow = {
  symbol: string;
  label: string;
  mapsToActions?: string[];
};

const ROWS = (
  Array.isArray(inventory) ? inventory : (inventory as { detectors: InventoryRow[] }).detectors
) as InventoryRow[];

/** Every name a retired-domain command answers to. */
const RETIRED_ACTIONS = new Set(
  COMMAND_SPECS.filter((s) =>
    RETIRED_DETECTOR_DOMAINS.includes(s.domain.toLowerCase()),
  ).flatMap((s) => [s.id, ...s.aliases]),
);

/**
 * A detector belongs to a retired slice when **every** action it maps to is in
 * a retired domain. `every` rather than `some`: a detector that also routes a
 * live command is not the slice's to retire, and folding it in here would let
 * a real routing use hide behind this assertion.
 */
const SLICE_DETECTORS = ROWS.filter(
  (d) =>
    d.label === 'legacy_paraphrase' &&
    (d.mapsToActions ?? []).length > 0 &&
    (d.mapsToActions ?? []).every((a) => RETIRED_ACTIONS.has(a)),
).map((d) => d.symbol);

const RESCUE_PATH = path.join(__dirname, 'ai-intent-rescue.service.ts');
const RESCUE_SOURCE = fs.readFileSync(RESCUE_PATH, 'utf8');
const RESCUE_LINES = RESCUE_SOURCE.split('\n');

/** Line indices where `symbol` is called (not merely imported). */
function callSites(symbol: string): number[] {
  const call = new RegExp(String.raw`\b${symbol}\s*\(`);
  return RESCUE_LINES.map((line, i) => ({ line, i }))
    .filter(({ line }) => call.test(line))
    .map(({ i }) => i);
}

/**
 * Does the statement containing this call resolve to `return null`?
 *
 * Scans forward to the first `return`. A `return null` means the detector
 * declined; anything else — `return { action: … }`, a rescue helper — means it
 * decided, which is the thing this file exists to forbid.
 */
function declinesAt(index: number): boolean {
  for (let i = index; i < Math.min(index + 12, RESCUE_LINES.length); i++) {
    const line = RESCUE_LINES[i];
    if (/\breturn\s+null\s*;/.test(line)) return true;
    if (/\breturn\b/.test(line)) return false;
  }
  return false;
}

describe('the retired slices are identified from the committed inventory', () => {
  it('finds the 15 tour/guide paraphrase matchers', () => {
    // If this collapses to 0 the assertions below become vacuous — a green run
    // would mean "we checked nothing", which is the failure mode a source-text
    // test is most prone to.
    expect(SLICE_DETECTORS.length).toBeGreaterThanOrEqual(15);
  });

  it('covers both retired domains', () => {
    expect(RETIRED_DETECTOR_DOMAINS).toEqual(
      expect.arrayContaining(['tour', 'guide']),
    );
    expect(RETIRED_ACTIONS.size).toBeGreaterThan(20);
  });
});

describe('no retired detector may decide an action (e2e-bug.394 exit criterion)', () => {
  it('rescue calls every slice detector only to decline', () => {
    const deciding: string[] = [];
    for (const symbol of SLICE_DETECTORS) {
      for (const index of callSites(symbol)) {
        if (!declinesAt(index)) {
          deciding.push(`${symbol} at ai-intent-rescue.service.ts:${index + 1}`);
        }
      }
    }
    // Naming them rather than counting: a bare number tells whoever broke this
    // that something is wrong, not which call to look at.
    expect(deciding).toEqual([]);
  });

  it('actually inspected some call sites', () => {
    // Guards the guard. If `callSites` stopped matching — a rename, a
    // formatting change that splits the call across lines — the assertion
    // above would pass by finding nothing to check.
    const total = SLICE_DETECTORS.reduce(
      (n, s) => n + callSites(s).length,
      0,
    );
    expect(total).toBeGreaterThan(0);
  });
});
