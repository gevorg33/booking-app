import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} from './ai-command-registry.build.js';
import {
  assertIntentPermissionParity,
  buildIntentPermissionCases,
  expectedRuntimeDeniedAction,
  formatIntentPermissionParityReport,
  PERMISSION_PROBE_SCENARIOS,
  resolveAllowedTiersOnSurface,
} from './ai-parity-2.5-permission.util.js';
import { isIntentAllowed } from './ai-capability.matrix.js';

describe('ai-parity-2.5-permission (parity-2.5)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const permissionCases = buildIntentPermissionCases(registry);

  it('generates permission cases for every registry intent × surface × tier', () => {
    expect(permissionCases.length).toBe(registry.length * 4 * 4);
    expect(permissionCases.length).toBeGreaterThan(4000);
  });

  it.each(PERMISSION_PROBE_SCENARIOS)(
    '$id — $expect on $surface/$tier for $intentId',
    ({ intentId, surface, tier, expect: expectation }) => {
      const allowed = isIntentAllowed(surface, tier, intentId);
      expect(allowed).toBe(expectation === 'allow');
    },
  );

  it('maps runtime denials to security_blocked on customer surface only', () => {
    expect(expectedRuntimeDeniedAction('customer', 'book_package')).toBe(
      'security_blocked',
    );
    expect(expectedRuntimeDeniedAction('dashboard', 'payment_sweep')).toBe(
      'payment_sweep',
    );
    expect(expectedRuntimeDeniedAction('provider', 'payment_sweep')).toBe(
      'payment_sweep',
    );
  });

  it('resolves allowed tiers from access-control matrix per surface', () => {
    expect(resolveAllowedTiersOnSurface('optimize_schedule', 'dashboard')).toEqual(
      ['owner'],
    );
    expect(resolveAllowedTiersOnSurface('list_bookings', 'provider')).toEqual(
      expect.arrayContaining(['staff', 'manager', 'owner']),
    );
    expect(resolveAllowedTiersOnSurface('book_package', 'customer')).toEqual([
      'client',
    ]);
    expect(resolveAllowedTiersOnSurface('book_appointment', 'public')).toEqual([
      'client',
    ]);
    expect(resolveAllowedTiersOnSurface('unknown', 'dashboard')).toEqual(
      expect.arrayContaining(['client', 'owner']),
    );
  });

  it('passes full intent permission parity gate on live registry', () => {
    const status = assertIntentPermissionParity(registry);
    if (!status.complete) {
      console.log(formatIntentPermissionParityReport(status));
    }
    expect(status.complete).toBe(true);
    expect(status.casesChecked).toBe(permissionCases.length);
    expect(status.surfaceLeaks).toBe(0);
    expect(status.tierMismatches).toBe(0);
    expect(status.registryTierMismatches).toBe(0);
  });

  it('formats parity-2.5 permission report', () => {
    const status = assertIntentPermissionParity(registry);
    const text = formatIntentPermissionParityReport(status);
    expect(text).toContain('AI Intent Permission Parity (parity-2.5)');
    if (process.env.PARITY_25_REPORT === '1') {
      console.log(text);
    }
  });
});
