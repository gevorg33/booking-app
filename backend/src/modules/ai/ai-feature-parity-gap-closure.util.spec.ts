import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParityGapClosureComplete,
  formatParityGapClosureReport,
  PARITY_GAP_CLOSURE_TARGET,
} from './ai-feature-parity-gap-closure.util.js';
import { buildAiParityCoverageReport } from './ai-feature-parity.util.js';

describe('ai-feature-parity-gap-closure (parity-2)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);
  const report = buildAiParityCoverageReport(catalog);

  it('targets 100% coverage on every role/surface pair', () => {
    const status = assertParityGapClosureComplete(report);
    if (!status.complete) {
      console.log(formatParityGapClosureReport(status));
    }
    expect(status.complete).toBe(true);
  });

  it('formats parity-2 gap closure report', () => {
    const status = assertParityGapClosureComplete(report);
    const text = formatParityGapClosureReport(status);
    expect(text).toContain('AI Feature Parity Gap Closure (parity-2)');
    expect(text).toContain('Target:');

    if (process.env.PARITY_2_REPORT === '1') {
      console.log(text);
    }
  });

  it('marks auth shells as covered via aiExempt', () => {
    const authShells = [
      'customer.auth.login',
      'public.auth.login',
      'provider.auth.login',
      'provider.auth.accept_invite',
    ];
    for (const featureId of authShells) {
      const entry = catalog.find((row) => row.id === featureId);
      expect(entry?.aiExempt).toBe(true);
    }
    const clientCustomer = report.byRoleSurface.find(
      (row) => row.tier === 'client' && row.surface === 'customer',
    )!;
    expect(clientCustomer.gaps).not.toContain('customer.auth.login');
  });
});
