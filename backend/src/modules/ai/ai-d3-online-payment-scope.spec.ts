/**
 * §175 (e2e-bug.349, D3's last item) — the two halves that shipped.
 *
 * The reported prompt's final sentence, "Turn on online payment for everything",
 * used to be swallowed into the preceding step's segment and never classified.
 * Two things were wrong; both are fixed here. A third is not, and is recorded in
 * the D3 section rather than half-built: the catalog compound has no executor for
 * a payments-config step.
 */
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { isConfigureServiceOnlinePaymentPrompt } from './ai-service-online-payment.util.js';

const REPORTED =
  'Create categories Y and Z. Under Y add service A (30 min, $50) and service B (45 min, $45). Under Z add service C (60 min, $70). Turn on online payment for everything.';

describe('D3 — the trailing sentence is split off (§175)', () => {
  it('no longer bleeds into the preceding step segment', () => {
    // Before the fix, step 1's segment ran to the end of the prompt and carried
    // "Turn on online payment for everything." inside it.
    const result = decomposeDeterministicForSurface('dashboard', REPORTED);
    expect(result?.steps[1].segment).toBe(
      'Under Z add service C (60 min, $70)',
    );
    expect(result?.steps[1].segment).not.toMatch(/online payment/i);
  });

  it('now classifies the trailing sentence as its own step (e2e-bug.448(b))', () => {
    // **This count changed from 2 to 3 deliberately.** §175 split the sentence
    // off but nothing classified it, so the prompt decomposed into the two
    // catalog steps and the toggle was silently dropped. D3's items (3) and (4)
    // give it a classifier branch and a place in the recipe's allowlist.
    //
    // The ordering mattered and is worth recording: shipping this before the
    // executor had a case for the step (item (5), e2e-bug.448(b)) would have
    // made the prompt *worse*, not better — a third step with no `case` hits
    // `default`, which fails the whole compound on top of catalog rows that
    // were already written.
    const result = decomposeDeterministicForSurface('dashboard', REPORTED);
    expect(result?.steps).toHaveLength(3);
    expect(result?.steps[2].action).toBe('configure_service_online_payment');
    expect(result?.steps[2].segment).toBe(
      'Turn on online payment for everything.',
    );
  });

  it.each([
    // `turn` is in the sentence branch only. In CATALOG_STEP_VERBS it would arm
    // the `;` and ` and ` branches too and reopen e2e-bug.347's over-splitting.
    'Add service Blow Dry and turn the lights off',
    'Create service A (30 min, $50) and service B (45 min, $45)',
    'Create category Hair with services: Cut (30 min, $50), Colour (60 min, $90)',
  ])('does not over-split: %s', (prompt) => {
    const result = decomposeDeterministicForSurface('dashboard', prompt);
    // None of these are multi-step catalog compounds; the guard is that adding
    // `turn` did not make them one.
    expect(result?.steps?.length ?? 0).toBeLessThan(2);
  });
});

describe('D3 — "everything" is a service online-payment scope (§175)', () => {
  it.each([
    'Turn on online payment for everything',
    'Turn off online payment for everything',
  ])('accepts %s', (prompt) => {
    expect(isConfigureServiceOnlinePaymentPrompt(prompt)).toBe(true);
  });

  it.each([
    // Widening the scope list is safe because it is one of three required
    // conjuncts — these lack the payment signal or the verb.
    'Delete everything',
    'Turn on notifications for everything',
    'Show me everything',
  ])('still rejects %s', (prompt) => {
    expect(isConfigureServiceOnlinePaymentPrompt(prompt)).toBe(false);
  });

  it('keeps the pre-existing explicit scope working', () => {
    expect(
      isConfigureServiceOnlinePaymentPrompt(
        'Enable online payment for all services',
      ),
    ).toBe(true);
  });
});
