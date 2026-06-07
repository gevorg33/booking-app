import {
  CLINIC_PATIENT_CHART_RESCUE_SCENARIOS,
  EXPLAIN_PATIENT_CHART_PROMPTS,
} from './ai-clinic-patient-chart.fixtures.js';
import {
  extractPatientChartCustomerNameFromPrompt,
  extractPatientChartFocusFromPrompt,
  isExplainPatientChartPrompt,
  parseExplainPatientChartFromPrompt,
  rescueClinicPatientChartIntent,
} from './ai-clinic-patient-chart.util.js';

describe('ai-clinic-patient-chart.util', () => {
  it.each(EXPLAIN_PATIENT_CHART_PROMPTS)(
    'detects explain patient chart prompt $id',
    ({ prompt, customerName, focus }) => {
      expect(isExplainPatientChartPrompt(prompt)).toBe(true);
      const parsed = parseExplainPatientChartFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.customerName).toBe(customerName);
      if (focus) {
        expect(parsed?.focus).toEqual(expect.arrayContaining(focus));
      }
    },
  );

  it('extracts possessive chart customer names', () => {
    expect(
      extractPatientChartCustomerNameFromPrompt(
        "Explain Maria's patient chart",
      ),
    ).toBe('Maria');
  });

  it('extracts chart focus sections from prompt', () => {
    expect(
      extractPatientChartFocusFromPrompt(
        'Show allergies and last visits for Maria on her chart',
      ),
    ).toEqual(['allergies', 'visits']);
  });

  it.each(CLINIC_PATIENT_CHART_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueClinicPatientChartIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );
});
