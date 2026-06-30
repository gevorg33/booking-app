import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS,
  assertCustomerIntentCoverageGateManifest,
  buildAiCustomerIntentCoverageGateTestPathPattern,
  CUSTOMER_INTENT_COVERAGE_REQUIRED_BASELINE_COUNT,
  listCustomerIntentCoverageGateGaps,
  listGraduatedCustomerIntentCoverageRequired,
} from './ai-customer-intent-coverage.gate.util.js';
import { CUSTOMER_INTENT_PROMOTION_INTENT_LIST } from './ai-customer-intent-promotion.intents.js';
import { CUSTOMER_INTENT_COVERAGE_REQUIRED } from './ai-customer-intent-coverage.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

const packageJsonPath = join(process.cwd(), 'package.json');

describe('ai customer intent coverage gate manifest (ai-cmd-customer-4.0.3)', () => {
  it('defines gate spec patterns for required + promotion + deferred locale suites', () => {
    expect(AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS).toEqual([
      'ai-customer-intent-coverage',
      'ai-customer-intent-promotion',
      'customer-ai-command-promotion\\.integration',
      'ai-customer-deferred-locale-parity',
    ]);
    expect(buildAiCustomerIntentCoverageGateTestPathPattern()).toBe(
      '(ai-customer-intent-coverage|ai-customer-intent-promotion|customer-ai-command-promotion\\.integration|ai-customer-deferred-locale-parity)',
    );
  });

  it('wires npm run test:ai-customer-intent-coverage to the gate manifest', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const script = packageJson.scripts?.['test:ai-customer-intent-coverage'];
    expect(script).toBeDefined();
    expect(script).toContain(buildAiCustomerIntentCoverageGateTestPathPattern());
  });

  it('tracks every promoted intent in CUSTOMER_INTENT_COVERAGE_REQUIRED', () => {
    expect(assertCustomerIntentCoverageGateManifest()).toEqual([]);
    expect(listGraduatedCustomerIntentCoverageRequired()).toEqual([
      ...CUSTOMER_INTENT_PROMOTION_INTENT_LIST,
    ]);
    expect(CUSTOMER_INTENT_COVERAGE_REQUIRED.length).toBe(
      CUSTOMER_INTENT_COVERAGE_REQUIRED_BASELINE_COUNT +
        CUSTOMER_INTENT_PROMOTION_INTENT_LIST.length,
    );
  });

  it('reports no gate gaps for required + graduated promotion intents', () => {
    expect(listCustomerIntentCoverageGateGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES)).toEqual(
      [],
    );
  });
});
