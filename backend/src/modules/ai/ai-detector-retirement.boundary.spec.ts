/**
 * AI-ROADMAP Phase 8 — the retirement ratchet.
 *
 * `ai-detector-retirement.util.spec.ts` tests the rules; this measures the real
 * tree and pins the result so progress cannot silently reverse.
 *
 * Two directions matter, and only one is a failure:
 *
 * - readiness going **down** means a spec lost examples, a command fell below
 *   the accuracy bar, or a new unevaluated detector appeared. That is a
 *   regression;
 * - readiness going **up** is the point. The floor is raised by editing this
 *   file, which is a visible act — same shape as §45's completion floors.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRetirementReport,
  type InventoryDetector,
} from './ai-detector-retirement.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';

const inventory = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ai-command-inventory.json'), 'utf8'),
) as { detectors: InventoryDetector[] };

const baseline = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'eval', 'ai-command-eval.baseline.json'),
    'utf8',
  ),
) as { byIntent: Record<string, { passed: number; total: number }> };

const report = buildRetirementReport(
  inventory.detectors,
  COMMAND_SPECS,
  baseline.byIntent,
);

/**
 * Measured 2026-08-07, re-measured after §77's domain merge. May only rise —
 * **except when detectors are deleted**, which lowers both counts legitimately.
 *
 * The merge did not change which detectors are ready — readiness is per command,
 * not per domain — only how they group.
 *
 * 2026-08-08 (§107, e2e-bug.354): 13 detectors with no production caller were
 * deleted. Ten were `legacy_paraphrase`, so `TOTAL_PARAPHRASE` falls 555 → 545;
 * three of those ten counted as ready, so `READY_FLOOR` falls 318 → 315.
 *
 * A drop in `READY_FLOOR` that is *not* accompanied by a drop in
 * `TOTAL_PARAPHRASE` is the regression this floor exists to catch: it means a
 * spec lost examples or a command fell below §42's bar, rather than a detector
 * being removed.
 *
 * 2026-08-10 (§148, e2e-bug.358): 545 -> 544, and **not** by deletion.
 * `isCustomerBookingContextPrompt` began guarding
 * `rescueExplainProviderAvailabilityIntent`, which reclassifies it from
 * `legacy_paraphrase` to `routing_shape` — "used to block or scope another
 * detector". Nothing was removed; a matcher became a guard.
 *
 * That is a third legitimate way this number falls, alongside deletion, and it
 * is the direction Phase 8 wants: a guard is not a paraphrase detector to
 * retire. `READY_FLOOR` is unchanged, and its assertion still passes, which is
 * the check that distinguishes this from a spec quietly losing examples.
 *
 * 2026-08-10 (§149, e2e-bug.424): 544 -> 548. Nine provider explainers were
 * added to `PROVIDER_EXCLUSIVE_INTENTS`, and four of their detectors are now
 * labelled `legacy_paraphrase` because they match a *registered* intent — before
 * registration the inventory could not attribute them to a command. No detector
 * code was written; a rise here is what registering an existing detector looks
 * like.
 */
const READY_FLOOR = 315;
const TOTAL_PARAPHRASE = 548;

describe('Phase 8 retirement readiness', () => {
  it('still has the paraphrase detectors it started with', () => {
    // The count only drops when a slice is actually deleted, which is a
    // deliberate act that should also move this number.
    expect(report.totalDetectors).toBe(TOTAL_PARAPHRASE);
  });

  it('has not gone backwards on readiness', () => {
    // Down means a spec lost examples, a command fell below §42's bar, or an
    // unevaluated detector appeared.
    expect(report.readyDetectors).toBeGreaterThanOrEqual(READY_FLOOR);
  });

  it('keeps the slice-ready domains slice-ready', () => {
    // §68 recorded four: appointment, guide, recommendation, tour. Two of those
    // were slivers of a fragmented taxonomy — `appointment` (5 detectors) was
    // part of `booking`, `recommendation` (8) part of `commerce` — and both
    // disappeared when §77 merged the duplicates. They were never separately
    // retirable; the boundary was an artefact.
    //
    // `tour` and `guide` are real: distinct verticals with their own commands.
    // Losing one is a regression in that domain, not in this gate.
    for (const domain of ['guide', 'tour']) {
      expect(report.sliceReadyDomains).toContain(domain);
    }
  });

  it('reports why the rest are blocked, so a slice can be planned', () => {
    const blocked = report.byDomain.filter((d) => !d.sliceReady);
    expect(blocked.length).toBeGreaterThan(0);
    for (const d of blocked) expect(d.blockers.length).toBeGreaterThan(0);
  });

  it('names `not_evaluated` as the dominant blocker', () => {
    // The actionable finding: the thing standing between Phase 8 and its exit is
    // mostly missing eval coverage, not planner accuracy. §44's miss→fixture
    // pipeline is the tool for that.
    const counts = new Map<string, number>();
    for (const d of report.byDomain) {
      for (const b of d.blockers) {
        counts.set(b.reason, (counts.get(b.reason) ?? 0) + b.count);
      }
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    expect(top[0]).toBe('not_evaluated');
  });
});
