import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParity41CiGate,
  formatParity41GateReport,
} from './ai-parity-4.1.util.js';

describe('ai-parity-4.1 (parity CI gate)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it('assertParity41CiGate passes on live catalog', () => {
    expect(() => assertParity41CiGate(catalog)).not.toThrow();
  });

  it('formats parity-4.1 gate report', () => {
    const status = assertParity41CiGate(catalog);
    const text = formatParity41GateReport(status);
    expect(text).toContain('AI Feature Parity CI Gate (parity-4.1)');
    expect(text).toContain('PASS');

    if (process.env.PARITY_41_REPORT === '1') {
      console.log(text);
    }
  });
});
