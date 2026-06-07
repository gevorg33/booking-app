import {
  ENTER_TEST_RESULT_PROMPTS,
  RELEASE_TEST_RESULT_PROMPTS,
  CLINIC_TEST_RESULT_RESCUE_SCENARIOS,
} from './ai-clinic-test-result.fixtures.js';
import {
  extractMeasurementReadingFromPrompt,
  extractOrderIdFromPrompt,
  extractReleaseCustomerNameFromPrompt,
  isEnterTestResultPrompt,
  isReleaseTestResultPrompt,
  parseEnterTestResultFromPrompt,
  parseReleaseTestResultFromPrompt,
  rescueClinicTestResultIntent,
} from './ai-clinic-test-result.util.js';

describe('ai-clinic-test-result.util', () => {
  it.each(ENTER_TEST_RESULT_PROMPTS)(
    'detects enter test result prompt $id',
    ({ prompt, measurementCode, value, orderId, resultId }) => {
      expect(isEnterTestResultPrompt(prompt)).toBe(true);
      const parsed = parseEnterTestResultFromPrompt(prompt);
      expect(parsed?.measurementCode).toBe(measurementCode);
      expect(parsed?.value).toBe(value);
      if (orderId) expect(parsed?.orderId).toBe(orderId);
      if (resultId) expect(parsed?.resultId).toBe(resultId);
    },
  );

  it.each(RELEASE_TEST_RESULT_PROMPTS)(
    'detects release test result prompt $id',
    ({ prompt, customerName, orderId, resultId }) => {
      expect(isReleaseTestResultPrompt(prompt)).toBe(true);
      const parsed = parseReleaseTestResultFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerName) expect(parsed?.customerName).toBe(customerName);
      if (orderId) expect(parsed?.orderId).toBe(orderId);
      if (resultId) expect(parsed?.resultId).toBe(resultId);
    },
  );

  it('extracts order ids with hash prefix', () => {
    expect(extractOrderIdFromPrompt('Enter WBC 12.5 for order #abc123')).toBe(
      'abc123',
    );
  });

  it('extracts measurement code and numeric value', () => {
    expect(
      extractMeasurementReadingFromPrompt('Enter WBC 12.5 for order abc123'),
    ).toEqual({ measurementCode: 'WBC', value: '12.5' });
  });

  it('extracts release customer names from possessive phrasing', () => {
    expect(
      extractReleaseCustomerNameFromPrompt("Release Maria's lab results"),
    ).toBe('Maria');
  });

  it.each(CLINIC_TEST_RESULT_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueClinicTestResultIntent(prompt, misclassifiedAction);
      expect(rescued?.action).toBe(expectedAction);
    },
  );
});
