/**
 * e2e-bug.436 — a customer-surface command must not run for a dashboard owner.
 *
 * Four dashboard/owner prompts were rescued to commands whose specs declare
 * `surfaces: ['customer','public']`. Three failed (bad answers); one —
 * `my_gift_cards` — **executed**, so the surface contract was not enforced
 * where it mattered.
 *
 * **The cause was a spec/registry disagreement, and it closed itself.**
 * `acceptRescueForSurface` always consulted `isIntentAllowedOnSurface`, but that
 * reads the registry, and the registry was hand-maintained and said these were
 * dashboard-legal. §161–§164 made `COMMAND_REGISTRY` generate *from*
 * `CommandSpec`, so the two can no longer disagree and the gate now rejects.
 *
 * These pin that outcome, because it is an emergent property of two separate
 * pieces of work rather than a line anyone wrote to cause it — exactly the kind
 * of fix that regresses silently.
 */
import { acceptRescueForSurface } from './ai-intent-rescue-pipeline.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

const rescue = (action: string) =>
  ({ action, params: {}, reasoning: '', rescued: true }) as any;

/** The three consumer-only commands from the ticket's table. */
const CONSUMER_ONLY = [
  'my_gift_cards',
  'my_subscriptions',
  'loyalty_points_balance',
] as const;

describe('e2e-bug.436 — consumer-only commands are refused on dashboard', () => {
  it.each(CONSUMER_ONLY)('registry agrees %s is not a dashboard command', (action) => {
    expect(isIntentAllowedOnSurface(action, 'dashboard')).toBe(false);
    expect(isIntentAllowedOnSurface(action, 'customer')).toBe(true);
  });

  it.each(CONSUMER_ONLY)('the rescue gate rejects %s on dashboard', (action) => {
    // `my_gift_cards` is the one that actually executed for an owner.
    expect(acceptRescueForSurface(rescue(action), 'dashboard')).toBeNull();
  });

  it('still accepts them on their own surface', () => {
    // Guards the gate being tightened into uselessness.
    for (const action of CONSUMER_ONLY) {
      expect(acceptRescueForSurface(rescue(action), 'customer')).not.toBeNull();
    }
  });

  it('an ABSENT surface still accepts them — the remaining hole', () => {
    // `acceptRescueForSurface` opens with `if (!surface) return result`, so an
    // unknown surface is the *permissive* value. Pinned as current behaviour,
    // not as desired behaviour: it is the same fail-open default that made
    // e2e-bug.444 look like a live steal, and it is why the fix above depends
    // on every caller actually passing its surface.
    expect(acceptRescueForSurface(rescue('my_gift_cards'), undefined)).not.toBeNull();
  });
});
