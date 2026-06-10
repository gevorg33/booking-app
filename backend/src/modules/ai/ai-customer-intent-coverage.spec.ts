import {
  auditCustomerIntentCoverage,
  collectCustomerEvalIntents,
  collectCustomerFixtureIntents,
  CUSTOMER_INTENT_COVERAGE_DEFERRED,
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  listCustomerIntentCoverageGaps,
} from './ai-customer-intent-coverage.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai customer intent coverage util (ai-cmd-customer-2.6)', () => {
  it('collects customer eval intents from compound and rescue eval rows', () => {
    const evalIntents = collectCustomerEvalIntents(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(evalIntents.has('book_package')).toBe(true);
    expect(evalIntents.has('book_nearest_slot')).toBe(true);
    expect(evalIntents.has('check_providers_for_service')).toBe(true);
  });

  it('collects customer fixture intents from decomposition and domain fixtures', () => {
    const fixtureIntents = collectCustomerFixtureIntents();
    expect(fixtureIntents.has('book_package')).toBe(true);
    expect(fixtureIntents.has('list_services')).toBe(true);
    expect(fixtureIntents.has('check_providers_for_service')).toBe(true);
  });
});

describe('ai customer intent coverage gate (ai-cmd-customer-2.6)', () => {
  it('covers every shipped required customer intent with fixtures and eval', () => {
    const gaps = listCustomerIntentCoverageGaps(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(gaps).toEqual([]);
  });

  it('documents deferred registry intents separately from the required gate', () => {
    expect(CUSTOMER_INTENT_COVERAGE_DEFERRED.size).toBeGreaterThan(10);
    for (const intent of CUSTOMER_INTENT_COVERAGE_REQUIRED) {
      expect(CUSTOMER_INTENT_COVERAGE_DEFERRED.has(intent)).toBe(false);
    }
  });

  it('reports audit rows for every non-meta customer registry intent', () => {
    const rows = auditCustomerIntentCoverage(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(rows.length).toBeGreaterThan(40);
    expect(rows.every((row) => row.intent.length > 0)).toBe(true);
  });
});
