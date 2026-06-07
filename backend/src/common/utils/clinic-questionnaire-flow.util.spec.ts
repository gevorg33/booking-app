import {
  buildFlowContextFromFixture,
  CLINIC_QUESTIONNAIRE_ANSWER_SCENARIOS,
  CLINIC_QUESTIONNAIRE_FLOW_FIXTURES,
} from '../../modules/clinic-questionnaires/clinic-questionnaire.fixtures.js';
import {
  mergeAnswerMap,
  mapQuestionToFlowView,
  resolveInitialQuestionId,
  resolveNextQuestionId,
} from './clinic-questionnaire-flow.util.js';

describe('clinic-questionnaire-flow.util', () => {
  const ctx = buildFlowContextFromFixture(
    CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake,
  );

  it('starts on the first visible question', () => {
    expect(resolveInitialQuestionId(ctx, {})).toBe('q-referral');
  });

  it.each(CLINIC_QUESTIONNAIRE_ANSWER_SCENARIOS)(
    '$id resolves branching after referral answer',
    (scenario) => {
      expect(resolveInitialQuestionId(ctx, {})).toBe(
        scenario.expectedInitialQuestionId,
      );

      const yesPath = resolveNextQuestionId(ctx, 'q-referral', {
        'q-referral': ['opt-yes'],
      });
      expect(yesPath).toBe(scenario.expectedNextAfterReferralYes);

      const noPath = resolveNextQuestionId(ctx, 'q-referral', {
        'q-referral': ['opt-no'],
      });
      expect(noPath).toBe(scenario.expectedNextAfterReferralNo);
    },
  );

  it('walks child questions in flow views', () => {
    const nestedCtx = {
      ...ctx,
      questions: [
        ...ctx.questions,
        {
          id: 'q-child',
          parentQuestionId: 'q-referral',
          sequence: 1,
          type: 'display' as const,
          text: 'Extra info',
          subText: null,
          placeholder: null,
          required: false,
          repeatEnabled: false,
          maxLength: null,
          maxCount: null,
          regexPattern: null,
          validationErrorMessage: null,
          validationMaxDate: 'none' as const,
        },
      ],
    };

    const view = mapQuestionToFlowView(nestedCtx, nestedCtx.questions[0]);
    expect(view.childQuestions?.[0]?.id).toBe('q-child');
  });

  it('returns null when no questions are visible', () => {
    const hiddenCtx = {
      questions: [
        {
          id: 'q-hidden',
          parentQuestionId: null,
          sequence: 1,
          type: 'string' as const,
          text: 'Hidden',
          subText: null,
          placeholder: null,
          required: true,
          repeatEnabled: false,
          maxLength: null,
          maxCount: null,
          regexPattern: null,
          validationErrorMessage: null,
          validationMaxDate: 'none' as const,
        },
      ],
      options: [],
      constraints: [
        {
          id: 'c-hidden',
          questionnaireId: 'q-1',
          questionId: 'q-hidden',
          constraintQuestionId: 'q-missing',
          answerOptionId: null,
          staticAnswer: 'yes',
        },
      ],
    };

    expect(resolveInitialQuestionId(hiddenCtx, {})).toBeNull();
  });
});
