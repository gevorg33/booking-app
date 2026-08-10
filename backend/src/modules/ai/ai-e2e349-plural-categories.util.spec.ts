/**
 * e2e-bug.349, root cause 2 — the catalog cues matched `category` but not
 * `categories`.
 *
 * "Create categories Y and Z. Under Y add service A (30 min, $50)…" registered
 * **no** create-category context at all, so a dashboard catalog request was left
 * for whatever else would claim it — which is how a customer-surface
 * `add_services_to_cart` came to win step 1.
 */
import { isBulkCreateCatalogPrompt } from './ai-catalog.util.js';
import { isIntentAllowed } from './ai-capability.matrix.js';

describe('e2e-bug.349 plural category cues', () => {
  it('recognises the reported prompt', () => {
    expect(
      isBulkCreateCatalogPrompt(
        'Create categories Y and Z. Under Y add service A (30 min, $50) and service B (45 min, $45).',
      ),
    ).toBe(true);
  });

  it.each([
    'Create category Barber with beard trim (30 min, $20)',
    'add a new service category Nails with manicure (30 min, $25)',
    'create catalog category Spa with facial (60 min, $70)',
  ])('leaves the singular forms working: %s', (prompt) => {
    expect(isBulkCreateCatalogPrompt(prompt)).toBe(true);
  });

  it('still needs service lines, so a bare mention does not match', () => {
    // The plural cue widens the *category* half only; the service-line
    // requirement is what stops "what categories do I have" matching.
    expect(isBulkCreateCatalogPrompt('what categories do I have')).toBe(false);
    expect(isBulkCreateCatalogPrompt('cancel my appointment')).toBe(false);
  });
});

describe('e2e-bug.349 root cause 1 — the cross-surface leak', () => {
  it('denies the customer cart command on the dashboard', () => {
    // Closed by §100: `isIntentAllowed` reads `CommandSpec.tiers`, and
    // `booking.add_services_to_cart` declares surfaces customer/public only.
    // Before that it was a deny-list, and a command absent from the list was
    // permitted — which is exactly how a cart intent won a dashboard request.
    for (const tier of ['staff', 'manager', 'owner'] as const) {
      expect(isIntentAllowed('dashboard', tier, 'add_services_to_cart')).toBe(
        false,
      );
    }
  });

  it('still allows it where it belongs', () => {
    expect(isIntentAllowed('customer', 'client', 'add_services_to_cart')).toBe(
      true,
    );
  });
});
