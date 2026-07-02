import type { Business } from '../business/entities/business.entity.js';
import { handleExplainAbnormalResultFlagLogic } from './ai-explain-abnormal-result-flag.logic.js';
import {
  EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
  EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS,
} from './ai-explain-abnormal-result-flag.fixtures.js';
import { rescueExplainAbnormalResultFlagIntent } from './ai-explain-abnormal-result-flag.util.js';
import type { ExplainAbnormalResultFlagLogicDeps } from './ai-explain-abnormal-result-flag.logic.js';

const clinicBusiness = {
  id: 'biz-1',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
} as Business;

function buildDeps(
  overrides: Partial<ExplainAbnormalResultFlagLogicDeps> = {},
) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(clinicBusiness),
    },
    ...overrides,
  } satisfies ExplainAbnormalResultFlagLogicDeps;
}

describe('ai-explain-abnormal-result-flag.logic (ai-cmd-customer-4.14.6)', () => {
  it.each(
    EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_abnormal_result_flag for $0', async (_id, prompt) => {
    const result = await handleExplainAbnormalResultFlagLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_abnormal_result_flag');
    expect(result.details?.notMedicalAdvice).toBe(true);
    expect(result.details?.measurementFlagFaq).toBe(true);
    expect(result.summary).toContain('not medical advice');
    expect(result.details?.navigate?.path).toBe('/results');
  });

  it('works without sign-in for general FAQ', async () => {
    const result = await handleExplainAbnormalResultFlagLogic(
      buildDeps(),
      'biz-1',
      {},
      'Is abnormal serious?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.customerId).toBeNull();
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainAbnormalResultFlagLogic(
      buildDeps(),
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('rejects non-clinic businesses', async () => {
    const result = await handleExplainAbnormalResultFlagLogic(
      buildDeps({
        businessRepo: {
          findOne: jest.fn().mockResolvedValue({
            ...clinicBusiness,
            settings: { businessType: 'salon' },
          }),
        },
      }),
      'biz-1',
      {},
      'What does high mean on my CBC?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('handles missing business', async () => {
    const result = await handleExplainAbnormalResultFlagLogic(
      buildDeps({
        businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
      }),
      'biz-1',
      {},
      'What does high mean on my CBC?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });

  it.each(EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to explain_abnormal_result_flag',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainAbnormalResultFlagIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_abnormal_result_flag');
    },
  );
});
