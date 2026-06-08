import { buildCommandRegistry, buildCompoundCommandRecipes, collectCompoundStepIds } from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import {
  assertParityCiGate,
  buildParityExitGate,
  formatParityExitGateReport,
  PARITY_AGENT_TASK_MIN_PASS_RATE,
} from './ai-parity-exit-gate.util.js';

describe('ai-parity-exit-gate (parity-4)', () => {
  const registry = buildCommandRegistry(
    collectCompoundStepIds(buildCompoundCommandRecipes()),
  );
  const catalog = buildAiFeatureCatalog(registry);

  it('buildParityExitGate passes on live catalog', () => {
    const result = buildParityExitGate(catalog);
    if (!result.met) {
      console.log(formatParityExitGateReport(result));
    }
    expect(result.met).toBe(true);
    expect(result.agentTaskPassRate).toBeGreaterThanOrEqual(
      PARITY_AGENT_TASK_MIN_PASS_RATE,
    );
    expect(result.allowDenyDivergenceCount).toBe(0);
    expect(result.extractionMissingCount).toBe(0);
  });

  it('assertParityCiGate passes for CI merge gate', () => {
    expect(() => assertParityCiGate(catalog)).not.toThrow();
  });

  it('formats parity-4 exit gate report', () => {
    const result = buildParityExitGate(catalog);
    const text = formatParityExitGateReport(result);
    expect(text).toContain('AI Feature Parity Exit Gate (parity-4.5)');
    expect(text).toContain('Feature→intent coverage');

    if (process.env.PARITY_4_REPORT === '1') {
      console.log(text);
    }
  });
});
