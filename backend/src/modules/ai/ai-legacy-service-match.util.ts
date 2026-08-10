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
export function matchServiceByNameLegacy<
  T extends { id: string; name: string },
>(list: T[], name: string): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}
