import { MULTILINGUAL_CLINIC_PATIENT_CHART_EVAL_SCENARIOS } from './ai-clinic-patient-chart-multilingual.fixtures.js';
import {
  parseExplainPatientChartFromPrompt,
  rescueClinicPatientChartIntent,
} from './ai-clinic-patient-chart.util.js';

describe('ai-clinic-patient-chart multilingual (i18n-clinic-v2-ai-3)', () => {
  it.each(MULTILINGUAL_CLINIC_PATIENT_CHART_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial, focus }) => {
      const rescued = rescueClinicPatientChartIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      const parsed = parseExplainPatientChartFromPrompt(prompt);
      expect(parsed).not.toBeNull();

      if (paramsPartial?.customerName) {
        expect(parsed?.customerName).toBe(paramsPartial.customerName);
      }
      if (focus) {
        expect(parsed?.focus).toEqual(expect.arrayContaining(focus));
      }
    },
  );
});
