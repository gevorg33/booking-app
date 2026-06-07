import {
  buildFlowContextFromFixture,
  CLINIC_QUESTIONNAIRE_FLOW_FIXTURES,
  CLINIC_QUESTIONNAIRE_VALIDATION_SCENARIOS,
} from '../../modules/clinic-questionnaires/clinic-questionnaire.fixtures.js';
import {
  validateAnswerBatch,
  validateQuestionAnswers,
} from './clinic-questionnaire-validation.util.js';

describe('clinic-questionnaire-validation.util', () => {
  const ctx = buildFlowContextFromFixture(
    CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake,
  );

  it.each(CLINIC_QUESTIONNAIRE_VALIDATION_SCENARIOS)(
    '$id validates answers for $questionId',
    (scenario) => {
      const errors = validateQuestionAnswers(
        ctx,
        scenario.questionId,
        scenario.answers,
      );
      expect(errors.length > 0).toBe(scenario.expectErrors);
    },
  );

  it('aggregates batch validation errors', () => {
    const errors = validateAnswerBatch(ctx, {
      'q-referral': [],
      'q-referrer-name': ['x'.repeat(121)],
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates regex, max count, invalid choices, and max dates', () => {
    const extendedCtx = {
      ...ctx,
      questions: [
        ...ctx.questions,
        {
          id: 'q-dob',
          parentQuestionId: null,
          sequence: 4,
          type: 'date' as const,
          text: 'Date of birth',
          subText: null,
          placeholder: null,
          required: true,
          repeatEnabled: false,
          maxLength: null,
          maxCount: null,
          regexPattern: null,
          validationErrorMessage: 'Enter a valid past date.',
          validationMaxDate: 'today' as const,
        },
        {
          id: 'q-tags',
          parentQuestionId: null,
          sequence: 5,
          type: 'multiple_choice' as const,
          text: 'Symptom tags',
          subText: null,
          placeholder: null,
          required: false,
          repeatEnabled: false,
          maxLength: null,
          maxCount: 1,
          regexPattern: null,
          validationErrorMessage: 'Pick at most one tag.',
          validationMaxDate: 'none' as const,
        },
        {
          id: 'q-code',
          parentQuestionId: null,
          sequence: 6,
          type: 'string' as const,
          text: 'Patient code',
          subText: null,
          placeholder: null,
          required: true,
          repeatEnabled: false,
          maxLength: null,
          maxCount: null,
          regexPattern: '^[A-Z]{3}$',
          validationErrorMessage: 'Use a three-letter code.',
          validationMaxDate: 'none' as const,
        },
      ],
      options: [
        ...ctx.options,
        {
          id: 'tag-a',
          questionId: 'q-tags',
          display: 'A',
          value: 'a',
          sequence: 1,
        },
        {
          id: 'tag-b',
          questionId: 'q-tags',
          display: 'B',
          value: 'b',
          sequence: 2,
        },
      ],
    };

    expect(
      validateQuestionAnswers(extendedCtx, 'q-code', { 'q-code': ['abc'] }),
    ).toHaveLength(1);
    expect(
      validateQuestionAnswers(extendedCtx, 'q-code', { 'q-code': ['ABC'] }),
    ).toHaveLength(0);
    expect(
      validateQuestionAnswers(extendedCtx, 'q-tags', { 'q-tags': ['a', 'b'] }),
    ).toHaveLength(1);
    expect(
      validateQuestionAnswers(extendedCtx, 'q-referral', {
        'q-referral': ['maybe'],
      }),
    ).toHaveLength(1);
    expect(
      validateQuestionAnswers(extendedCtx, 'q-dob', {
        'q-dob': ['2099-01-01'],
      }),
    ).toHaveLength(1);
    expect(
      validateQuestionAnswers(extendedCtx, 'q-dob', {
        'q-dob': ['2000-01-01'],
      }),
    ).toHaveLength(0);
  });
});
