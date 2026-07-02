import {
  CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS,
  EXPLAIN_PATIENT_RESULTS_PROMPTS,
  UPLOAD_PATIENT_RESULT_PROMPTS,
} from './ai-clinic-test-result-ext.fixtures.js';
import { validateClinicTestResultExtCommand } from './ai-clinic-test-result-ext-completion.util.js';
import type { ResolvedCommand } from './command-completion.types.js';

function baseCmd(overrides: Partial<ResolvedCommand>): ResolvedCommand {
  return {
    action: 'upload_patient_result',
    params: {},
    enrichedParams: {},
    entities: {},
    reasoning: 'test',
    confidence: 0.9,
    ...overrides,
  };
}

describe('ai-clinic-test-result-ext-completion.util', () => {
  it.each(UPLOAD_PATIENT_RESULT_PROMPTS.slice(0, 3))(
    'accepts upload prompt $id',
    ({ prompt, orderId }) => {
      const issues = validateClinicTestResultExtCommand(
        baseCmd({
          action: 'upload_patient_result',
          prompt,
          params: { orderId },
        }),
      );
      expect(issues).toEqual([]);
    },
  );

  it('requires orderId for upload_patient_result', () => {
    const issues = validateClinicTestResultExtCommand(
      baseCmd({ action: 'upload_patient_result', prompt: 'Upload lab result' }),
    );
    expect(issues.map((issue) => issue.field)).toEqual(['orderId']);
  });

  it.each(EXPLAIN_PATIENT_RESULTS_PROMPTS.slice(0, 3))(
    'accepts explain prompt $id',
    ({ prompt, customerName }) => {
      const issues = validateClinicTestResultExtCommand(
        baseCmd({
          action: 'explain_patient_results',
          prompt,
          params: { customerName },
        }),
      );
      expect(issues).toEqual([]);
    },
  );

  it('requires patient or order for explain_patient_results', () => {
    const issues = validateClinicTestResultExtCommand(
      baseCmd({
        action: 'explain_patient_results',
        prompt: 'Explain lab results',
      }),
    );
    expect(issues.map((issue) => issue.field)).toEqual(['customerName']);
  });

  it.each(CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS.slice(0, 3))(
    'accepts configure prompt $id',
    ({ prompt, measurementCode, normalLow, normalHigh }) => {
      const issues = validateClinicTestResultExtCommand(
        baseCmd({
          action: 'configure_test_reference_range',
          prompt,
          params: { measurementCode, normalLow, normalHigh },
        }),
      );
      expect(issues).toEqual([]);
    },
  );

  it('requires measurementCode and range bounds for configure_test_reference_range', () => {
    const issues = validateClinicTestResultExtCommand(
      baseCmd({
        action: 'configure_test_reference_range',
        prompt: 'Configure reference range',
        params: { measurementCode: 'WBC' },
      }),
    );
    expect(issues.map((issue) => issue.field)).toEqual([
      'normalLow',
      'normalHigh',
    ]);
  });

  it('accepts list_abnormal_results without params', () => {
    expect(
      validateClinicTestResultExtCommand(
        baseCmd({
          action: 'list_abnormal_results',
          prompt: 'List abnormal lab results',
        }),
      ),
    ).toEqual([]);
  });

  it('ignores unrelated actions', () => {
    expect(
      validateClinicTestResultExtCommand(
        baseCmd({ action: 'create_booking', prompt: 'Book haircut' }),
      ),
    ).toEqual([]);
  });
});
