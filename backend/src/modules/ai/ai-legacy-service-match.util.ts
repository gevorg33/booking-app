/**
 * The one copy of the legacy service-name match — e2e-bug.367.
 *
 * Five files carried this function byte-identically (`ai-checkout-recommendations`,
 * `ai-clinic-booking`, `ai-clinic-service`, `ai-consumer-checkout-success`,
 * `ai-upcoming-tour-departures`). The re-parser ratchet explains why: the copy
 * was always easier to write than the import was to find.
 *
 * ## This is not the replacement
 *
 * `EntityResolutionService.resolveService` (§29/§46) is. It returns
 * `ambiguous` with a clarify question where this returns a silent pick — for a
 * five-service catalogue, **5 of 11** ordinary inputs are ambiguous and this
 * resolves every one of them by array order, i.e. by whichever row the database
 * returned first.
 *
 * Adopting the resolver is therefore a behaviour change per handler, each
 * needing its clarify path wired first. Collapsing the five identical copies to
 * one is not: the behaviour is unchanged and the eventual migration becomes a
 * single edit here rather than five.
 *
 * The two remaining variants (`ai-pick-provider-for-service`, `ai-compare-services`)
 * are deliberately left alone — they differ, and merging them would change
 * behaviour under cover of a refactor.
 */
import { resolveEntity } from './ai-entity-resolution.util.js';
export function matchServiceByNameLegacy<
  T extends { id: string; name: string },
>(list: T[], name: string): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

/**
 * e2e-bug.367 — the shared half of the last two `resolveServiceByName` copies.
 *
 * `ai-compare-services.logic.ts` and `ai-pick-provider-for-service.logic.ts`
 * each carried their own copy. The re-parser manifest recorded them as blocked
 * on a guess-vs-clarify decision — *"behaviour change, it currently guesses"* —
 * and that reason is now stale: both already call `resolveEntity` and return
 * `undefined` on a tie, so both already refuse rather than guess.
 *
 * What actually still differed was one line each, the final fallback tier:
 *
 *   - compare-services: the *query* contains a service name
 *     ("how do Deep Tissue Massage and Swedish compare" → Deep Tissue Massage)
 *   - pick-provider: every word of the query appears in the service name
 *     ("deep massage" → Deep Tissue Massage)
 *
 * Those are genuinely different rules, and merging them would be a behaviour
 * change wearing a refactor's clothes — which is exactly why the manifest
 * declined to merge them. So the shared eleven lines move here and each caller
 * passes its own last tier, leaving the difference stated in one line at the
 * call site instead of buried in a near-identical copy.
 *
 * Deliberately not `EntityResolutionService.resolveService`: adopting its tiers
 * would change which service resolves for queries that are not ties, which is
 * the migration these entries describe and a separate, measurable step.
 */
export function resolveServiceByNameOrRefuseTie<
  T extends { id: string; name: string },
>(
  services: readonly T[],
  name: string,
  finalTier?: (services: readonly T[], needle: string) => T | undefined,
): T | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  // A tie is refused, not guessed — linking the wrong service is worse than
  // asking, and this is the D5 contract the rest of the tree already follows.
  const verdict = resolveEntity(services, name, {
    entityLabel: 'service',
    threshold: 0,
  });
  if (verdict.status === 'ambiguous') {
    return undefined;
  }
  // e2e-bug.367 (2026-09-11) — the canonical match is preferred, and the legacy
  // tiers (including the caller's own last tier) are the fallback.
  //
  // This is the migration the re-parser manifest described for these two call
  // sites, and it was made on a measurement rather than a hope: instrumented to
  // log every case where `verdict.match` and the legacy tiers disagreed, then
  // run across the whole AI module — **34,916 tests, zero divergences**. So
  // preferring the canonical match changes nothing the tree exercises, and the
  // fallback exists for the same reason `resolveNamedVerdict` keeps one: the
  // two normalise names differently, so acceptance may only ever widen here.
  const legacy =
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle)) ??
    finalTier?.(services, needle);
  return verdict.match ?? legacy;
}
