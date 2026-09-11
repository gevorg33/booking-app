/**
 * e2e-bug.448(b) / D3 — the payments callback is injected, not merely accepted.
 *
 * `handleCatalogCompoundLogic` gained a `configure_service_online_payment` case
 * whose dependency arrives as an **optional** parameter:
 *
 *   configureServiceOnlinePayment
 *     ? await configureServiceOnlinePayment(...)
 *     : failure(step.action, 'Online payment could not be configured …')
 *
 * A `failure` there is not a soft degradation. The loop stops on the first
 * unsuccessful step and returns a failed compound, so an un-injected callback
 * makes the reported e2e-bug.349 prompt fail *on top of two categories and
 * three services that were really created* — worse than the old behaviour,
 * where the segment was never classified at all and the toggle was silently
 * omitted.
 *
 * The one production call site does inject it. This asserts that it keeps
 * doing so. Source-shape rather than behavioural, for the same reason as
 * `ai-command.confirmation-gate-wiring.spec.ts`: the invariant is about the
 * call site, and reaching it behaviourally needs the whole dashboard pipeline
 * stubbed into exact internal shapes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMMAND_SRC = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);
const LOGIC_SRC = readFileSync(join(__dirname, 'ai-catalog.logic.ts'), 'utf8');

describe('e2e-bug.448(b) — catalog compound gets its payments callback', () => {
  it('the executor still has a case for the step, not just a default', () => {
    // If this case is removed the step falls to `default`, which is the
    // original e2e-bug.448 defect.
    expect(LOGIC_SRC).toContain("case 'configure_service_online_payment':");
  });

  it('an un-injected callback fails the step — so injection is load-bearing', () => {
    const idx = LOGIC_SRC.indexOf("case 'configure_service_online_payment':");
    expect(idx).toBeGreaterThan(-1);
    const body = LOGIC_SRC.slice(idx, idx + 700);
    expect(body).toContain('configureServiceOnlinePayment');
    expect(body).toMatch(/:\s*failure\(/);
  });

  it('the dashboard call site injects it', () => {
    const call = COMMAND_SRC.indexOf('this.catalog.handleCatalogCompound(');
    expect(call).toBeGreaterThan(-1);
    // The argument list, up to the closing of this call.
    const args = COMMAND_SRC.slice(call, call + 1200);
    expect(args).toContain('handleConfigureServiceOnlinePayment');
  });

  it('the catalog module still owns no payments dependency', () => {
    // The reason the callback is injected rather than resolved in the catalog
    // service: that module must not gain a payments import.
    const catalogService = readFileSync(
      join(__dirname, 'ai-catalog.service.ts'),
      'utf8',
    );
    expect(catalogService).not.toMatch(/from '\.\/ai-payments[\w.-]*\.js'/);
  });
});
