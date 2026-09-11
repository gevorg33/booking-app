/**
 * AI-ROADMAP Phase 2 — paraphrase invariance, measured on generated fixtures.
 *
 * The fixtures are generated from `CommandSpec.examples` (see
 * `ai-paraphrase-invariance.util.ts`), not hand-authored per intent. Adding a
 * command to a spec file extends the corpus automatically; it cannot drift from
 * the command because it is derived from it.
 *
 * ## Scope: a sample of the detector layer, not coverage of it
 *
 * e2e-bug.515 — this docstring used to say the subject under test was "the
 * deterministic detector layer, the 786 `is*Prompt` regexes". It is not. The
 * `DETECTORS` map below is hand-maintained at **ten commands**, while the
 * committed inventory reports **543** detectors whose action comes from their
 * own symbol name — so this measures roughly **2%** of the population it was
 * described as covering, and the census in TODO.md §240 found **54.5%** of the
 * wider population's documented examples unmatched against the ~14% visible
 * here. The reported figure is sound for these ten commands and is not
 * representative of the rest.
 *
 * That mattered because of how the number reads: a gate described as covering
 * the detector layer, reporting three misses, invites the conclusion that the
 * layer has three misses. The measurement was never wrong — the claim was. The
 * two figures are asserted against the inventory below so this paragraph cannot
 * quietly go stale the way the ratchet's own ceiling did (see §240).
 *
 * Widening to the censused population is a separate decision, not a silent one:
 * it means either importing 543 detector symbols to call them, or generating
 * that table — and it would land a ratchet with hundreds of entries, which is a
 * different kind of gate from this one.
 *
 * Within its ten commands, this is the only layer whose paraphrase behaviour
 * can be measured without a model in the loop: §21 established that planner
 * accuracy is answered by the shadow run on real traffic, not by fixtures.
 *
 * Two bars, deliberately different:
 *
 *   - `strict` transforms (casing, whitespace, trailing punctuation) must never
 *     change the answer. There is no argument available for failing these, so
 *     they are asserted at zero.
 *   - `natural` transforms ("please …", "can you …", a question mark) are
 *     ordinary human phrasing that an imperative-only regex will miss. Real
 *     debt, pre-existing, so it is ratcheted rather than demanded at zero.
 */
import {
  buildParaphraseCases,
  checkParaphraseInvariance,
  PARAPHRASE_TRANSFORMS,
  summarizeBreaksByTransform,
  type ParaphraseBreak,
} from './ai-paraphrase-invariance.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  isBulkCreateCatalogPrompt,
  isCreatePackagePrompt,
  isCreateServiceCategoryPrompt,
  isDeactivateServicePrompt,
  isListPackagesPrompt,
  isListSubscriptionPlansPrompt,
} from './ai-catalog.util.js';
import { isMarkPaidPrompt } from './ai-booking-depth.util.js';
import {
  isCancelMyBookingPrompt,
  isRescheduleMyBookingPrompt,
} from './ai-self-service-booking.util.js';
import { isBulkAssignServicesCategoryPrompt } from './ai-bulk-assign-services-category.util.js';

/**
 * Commands whose recogniser is a deterministic detector.
 *
 * Six of the sixteen specced commands are absent, and that is a fact about the
 * platform rather than a gap here: `create_booking`, `reschedule_booking`,
 * `cancel_bookings`, `update_bookings`, `book_appointment` and `update_service`
 * have no primary `is*Prompt` — they are chosen by the LLM classifier, with
 * detectors only in the rescue layer. Their paraphrase behaviour is therefore
 * not measurable deterministically, and is what §19's shadow run is for.
 */
const DETECTORS: Record<string, (prompt: string) => boolean> = {
  'appointment.mark_paid': isMarkPaidPrompt,
  'appointment.cancel_mine': isCancelMyBookingPrompt,
  'appointment.reschedule_mine': isRescheduleMyBookingPrompt,
  'catalog.create_category': isCreateServiceCategoryPrompt,
  'catalog.create_with_services': isBulkCreateCatalogPrompt,
  'catalog.deactivate_service': isDeactivateServicePrompt,
  'catalog.create_package': isCreatePackagePrompt,
  'catalog.assign_services_category_bulk': isBulkAssignServicesCategoryPrompt,
  'catalog.list_packages': isListPackagesPrompt,
  'catalog.list_subscription_plans': isListSubscriptionPlansPrompt,
};

/**
 * Ratchet on `natural`-transform breakage. Measured at **0**: every example the
 * detector layer recognises at all, it recognises under politeness, filler and
 * question phrasing too. Lower this if it ever rises — never raise it.
 */
const NATURAL_BREAK_BASELINE = 0;

/**
 * Spec examples their own command's detector does not match. Ratcheted, not
 * asserted at zero, because these are pre-existing gaps. Filed as **8 of 20** in
 * 2026-08-06; the live count is **3 of 21** as of §240 (e2e-bug.360), and the
 * three are named in `UNCOVERED_EXAMPLES` below rather than counted.
 *
 * This is the number that matters. Mechanical variation breaks nothing; genuine
 * phrasing variety breaks 40% of the corpus. Lower it by fixing a detector — or,
 * as the roadmap intends, by letting the planner own the domain and deleting the
 * detector entirely.
 */
const UNCOVERED_EXAMPLES: readonly string[] = [
  'catalog.assign_services_category_bulk: "move haircut and blow dry into Hair Care"',
  'catalog.list_packages: "What packages do I currently offer?"',
  'catalog.list_packages: "what packages do we sell"',
];
const UNCOVERED_EXAMPLE_BASELINE = UNCOVERED_EXAMPLES.length;
// 9 -> 3 on 2026-09-01 (§240), and converted from a ceiling to an exact set.
// The ceiling read `<= 9` while the live count had been **3** for some time: six
// of the nine documented misses were fixed by the Phase 8 detector work and
// nobody lowered the number, so the gate had six points of slack and could not
// see a regression from 3 back up to 9. Same shape as §215's T0 ceiling.
//
// Naming the three costs nothing and catches both directions — a regression on a
// specific phrasing, and a fix that lands without the record being updated.
// When `catalog` joins RESCUE_ACTION_LOCKED_DOMAINS all three go at once.

// 8 -> 9 on 2026-08-08 (§96), and a raised ratchet needs its reason on the
// record.
//
// The new entry is `catalog.list_packages: "What packages do I currently
// offer?"` — a real prompt from `ai_command_trace`, classified with confidence
// >= 0.9, executed, and never touched by rescue. It was added to the spec by
// e2e-bug.396's retrieval work, and its own detector does not match it.
//
// The gap is not new; only its documentation is. That phrasing was already
// reaching `list_packages` through the classifier while the detector missed it,
// and `catalog.list_packages: "what packages do we sell"` was already on this
// list for the same reason. Declining to add the example would have kept the
// number at 8 by leaving a known gap undocumented — the opposite of what this
// ratchet is for.
//
// It comes back down when `catalog` joins RESCUE_ACTION_LOCKED_DOMAINS and its
// detector stops being the thing that has to match.

const measured = COMMAND_SPECS.filter((s) => s.id in DETECTORS);

function runFor(commandId: string) {
  const spec = measured.find((s) => s.id === commandId)!;
  const cases = buildParaphraseCases([spec]);
  return checkParaphraseInvariance(cases, DETECTORS[commandId]);
}

describe('AI-ROADMAP Phase 2 — paraphrase invariance', () => {
  const allBreaks: ParaphraseBreak[] = [];
  const allUncovered: { command: string; bases: string[] }[] = [];
  let totalChecked = 0;

  for (const spec of measured) {
    const { breaks, uncoveredBases, checked } = runFor(spec.id);
    allBreaks.push(...breaks);
    totalChecked += checked;
    if (uncoveredBases.length) {
      allUncovered.push({ command: spec.id, bases: uncoveredBases });
    }
  }

  it('generates its fixtures from the specs, not from a hand-written list', () => {
    const cases = buildParaphraseCases(measured);
    // Every case traces back to a real `examples` entry on a real spec.
    for (const c of cases.slice(0, 50)) {
      const spec = measured.find((s) => s.id === c.command)!;
      expect(spec.examples).toContain(c.base);
    }
    expect(cases.length).toBeGreaterThan(
      measured.length * PARAPHRASE_TRANSFORMS.length,
    );
  });

  it('covers every specced command that has a deterministic recogniser', () => {
    expect(measured.map((s) => s.id).sort()).toEqual(
      Object.keys(DETECTORS).sort(),
    );
  });

  it(`does not lose more documented phrasings (baseline ${UNCOVERED_EXAMPLE_BASELINE})`, () => {
    // A spec example its own detector does not match is a coverage gap: the
    // command's *documented* phrasing does not reach the command. These seed the
    // planner's few-shots and the eval goldens, so a gap here is a gap
    // everywhere downstream.
    const count = allUncovered.reduce((n, u) => n + u.bases.length, 0);
    expect(count).toBe(UNCOVERED_EXAMPLE_BASELINE);
  });

  it('names which documented phrasings the detector layer misses', () => {
    const lines = allUncovered.flatMap((u) =>
      u.bases.map((b) => `${u.command}: "${b}"`),
    );

    console.log(
      `[AI-ROADMAP paraphrase] documented examples missed by their own detector: ` +
        `${lines.length}\n    ${lines.join('\n    ')}`,
    );
    // Exact set, not a count: two phrasings swapping places keeps a count at 3.
    expect(lines.sort()).toEqual([...UNCOVERED_EXAMPLES].sort());
  });

  describe('strict transforms — casing, whitespace, punctuation', () => {
    const strictBreaks = allBreaks.filter((b) => b.strictness === 'strict');

    it('never change which command is recognised', () => {
      expect(
        strictBreaks.map(
          (b) => `${b.command} [${b.transformId}] "${b.variant}"`,
        ),
      ).toEqual([]);
    });
  });

  describe('natural transforms — politeness, filler, question form', () => {
    const naturalBreaks = allBreaks.filter((b) => b.strictness === 'natural');

    it(`does not get worse (baseline ${NATURAL_BREAK_BASELINE})`, () => {
      expect(naturalBreaks.length).toBeLessThanOrEqual(NATURAL_BREAK_BASELINE);
    });

    it('reports which phrasing the detector layer misses', () => {
      const summary = summarizeBreaksByTransform(naturalBreaks);

      console.log(
        `[AI-ROADMAP paraphrase] ${totalChecked} variants checked · ` +
          `${naturalBreaks.length}/${NATURAL_BREAK_BASELINE} natural-phrasing breaks · ` +
          (summary.map((s) => `${s.transformId} ${s.count}`).join(' · ') ||
            'none'),
      );
      expect(totalChecked).toBeGreaterThan(0);
    });
  });
});

/**
 * e2e-bug.515 — the scope claim, asserted rather than written down.
 *
 * The header says this suite samples ten commands out of a population of 543.
 * Both halves of that are facts about the tree, and both drift: someone adds a
 * command to `DETECTORS`, or the detector layer grows. A stale scope claim is
 * exactly the defect this ticket was filed for, so it is checked here instead
 * of trusted — the same reasoning as §240's fix to this suite's own ceiling,
 * which read `<= 9` while the live count had been 3 for months.
 */
describe('e2e-bug.515 — the stated scope is still true', () => {
  const inventory = JSON.parse(
    require('node:fs').readFileSync(
      require('node:path').join(__dirname, 'ai-command-inventory.json'),
      'utf8',
    ),
  ) as { actionSourceCounts: Record<string, number> };

  /** Commands whose action is derived from their own `is<Action>Prompt` name. */
  const DOCUMENTED_POPULATION = 543;
  /** What the map above actually covers. */
  const DOCUMENTED_SAMPLE = 10;

  it('the population the header cites matches the committed inventory', () => {
    // Fails when the detector layer grows or shrinks, which is the moment to
    // update the header rather than let it rot.
    expect(inventory.actionSourceCounts.symbol_name).toBe(
      DOCUMENTED_POPULATION,
    );
  });

  it('the sample the header cites matches the map', () => {
    expect(Object.keys(DETECTORS)).toHaveLength(DOCUMENTED_SAMPLE);
  });

  it('is still a sample, so it is never read as coverage', () => {
    // The substance of e2e-bug.515: a suite reporting three misses while
    // described as covering the detector layer invites the reading that the
    // layer has three misses. If the map ever grows enough for that reading to
    // be fair, this fails and the header should be rewritten to claim it.
    const pct = (DOCUMENTED_SAMPLE / DOCUMENTED_POPULATION) * 100;
    expect(pct).toBeLessThan(5);
  });
});
