import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  CLINIC_PATIENT_CHART_RESCUE_SCENARIOS,
  EXPLAIN_PATIENT_CHART_PROMPTS,
} from './ai-clinic-patient-chart.fixtures.js';

describe('AiClinicPatientChart integration', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CLINIC_PATIENT_CHART_RESCUE_SCENARIOS)(
    'rescues dashboard prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(EXPLAIN_PATIENT_CHART_PROMPTS.slice(0, 4))(
    'rescues unknown classifier for chart prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_patient_chart');
    },
  );
});
