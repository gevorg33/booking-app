import { listProviderOnboardingLocaleParityGaps } from './ai-provider-onboarding-compound-locale-parity.util.js';
import {
  PROVIDER_ONBOARDING_EN_SCENARIO_IDS,
} from './ai-provider-onboarding-compound.fixtures.js';
import { PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS } from './ai-provider-onboarding-compound-multilingual.fixtures.js';
import {
  AI_COMMAND_EVAL_DETERMINISTIC_CASES,
  AI_COMMAND_EVAL_PROVIDER_ONBOARDING_COMPOUND_CASES,
} from './eval/ai-command-eval.cases.js';
import { AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES } from './ai-provider-onboarding-compound-multilingual.eval.util.js';

describe('ai-provider-onboarding-compound locale parity (parity-2.4)', () => {
  it('has HY/RU siblings for every EN provider onboarding scenario', () => {
    expect(listProviderOnboardingLocaleParityGaps()).toEqual([]);
  });

  it('multilingual scenario count matches EN ids × 2 locales', () => {
    expect(PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS).toHaveLength(
      PROVIDER_ONBOARDING_EN_SCENARIO_IDS.length * 2,
    );
  });

  it('registers EN + HY/RU eval cases in deterministic suite', () => {
    const evalIds = new Set(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES.map((row) => row.id),
    );
    for (const row of AI_COMMAND_EVAL_PROVIDER_ONBOARDING_COMPOUND_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
    for (const row of AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES) {
      expect(evalIds.has(row.id)).toBe(true);
    }
  });
});
