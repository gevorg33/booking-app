import {
  canStartPreVisitIntake,
  canSubmitPreVisitIntakeAnswers,
  isPreVisitIntakeComplete,
  mapResponseStatusToIntakeStatus,
  pickDefaultIntakeQuestionnaireId,
} from './clinic-pre-visit-intake.util.js';
import {
  CLINIC_DEFAULT_QUESTIONNAIRE_SCENARIOS,
  CLINIC_PRE_VISIT_INTAKE_STATUS_SCENARIOS,
} from './clinic-pre-visit-intake.fixtures.js';

describe('clinic-pre-visit-intake.util', () => {
  it.each(CLINIC_PRE_VISIT_INTAKE_STATUS_SCENARIOS)(
    '$id maps response status to intake status',
    (scenario) => {
      expect(
        mapResponseStatusToIntakeStatus(
          scenario.responseStatus,
          scenario.currentStatus,
        ),
      ).toBe(scenario.expected);
    },
  );

  it.each(CLINIC_DEFAULT_QUESTIONNAIRE_SCENARIOS)(
    '$id picks default intake questionnaire',
    (scenario) => {
      expect(
        pickDefaultIntakeQuestionnaireId({
          preferredQuestionnaireId: scenario.preferredQuestionnaireId,
          questionnaires: scenario.questionnaires,
        }),
      ).toBe(scenario.expectedId);
    },
  );

  it('tracks start/submit/complete helpers', () => {
    expect(canStartPreVisitIntake('assigned')).toBe(true);
    expect(canStartPreVisitIntake('completed')).toBe(false);
    expect(canSubmitPreVisitIntakeAnswers('in_progress')).toBe(true);
    expect(canSubmitPreVisitIntakeAnswers('completed')).toBe(false);
    expect(isPreVisitIntakeComplete('completed')).toBe(true);
  });
});
