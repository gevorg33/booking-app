import type { ClinicQuestionnaireFlowContext } from '../../common/utils/clinic-questionnaire-flow.util.js';
import type {
  ClinicQuestionnaireAnswerMap,
  ClinicQuestionnaireAnswerOptionDefinition,
  ClinicQuestionnaireConstraintDefinition,
  ClinicQuestionnaireQuestionDefinition,
} from '../../common/utils/clinic-questionnaire.types.js';

export const CLINIC_QUESTIONNAIRE_FLOW_FIXTURES = {
  referralIntake: {
    questionnaireId: 'q-1',
    questions: [
      {
        id: 'q-referral',
        parentQuestionId: null,
        sequence: 1,
        type: 'choice',
        text: 'Were you referred by an external doctor?',
        subText: null,
        placeholder: null,
        required: true,
        repeatEnabled: false,
        maxLength: null,
        maxCount: null,
        regexPattern: null,
        validationErrorMessage: 'Please choose yes or no.',
        validationMaxDate: 'none',
      },
      {
        id: 'q-referrer-name',
        parentQuestionId: null,
        sequence: 2,
        type: 'string',
        text: 'Referring doctor name',
        subText: null,
        placeholder: 'Dr Smith',
        required: true,
        repeatEnabled: false,
        maxLength: 120,
        maxCount: null,
        regexPattern: null,
        validationErrorMessage: 'Enter the referring doctor name.',
        validationMaxDate: 'none',
      },
      {
        id: 'q-symptoms',
        parentQuestionId: null,
        sequence: 3,
        type: 'text',
        text: 'Describe your symptoms',
        subText: null,
        placeholder: null,
        required: true,
        repeatEnabled: false,
        maxLength: 500,
        maxCount: null,
        regexPattern: null,
        validationErrorMessage: 'Symptoms are required.',
        validationMaxDate: 'none',
      },
    ] as ClinicQuestionnaireQuestionDefinition[],
    options: [
      {
        id: 'opt-yes',
        questionId: 'q-referral',
        display: 'Yes',
        value: 'yes',
        sequence: 1,
      },
      {
        id: 'opt-no',
        questionId: 'q-referral',
        display: 'No',
        value: 'no',
        sequence: 2,
      },
    ] as ClinicQuestionnaireAnswerOptionDefinition[],
    constraints: [
      {
        id: 'c-1',
        questionnaireId: 'q-1',
        questionId: 'q-referrer-name',
        constraintQuestionId: 'q-referral',
        answerOptionId: 'opt-yes',
        staticAnswer: null,
      },
    ] as ClinicQuestionnaireConstraintDefinition[],
  },
} as const;

export function buildFlowContextFromFixture(
  fixture: (typeof CLINIC_QUESTIONNAIRE_FLOW_FIXTURES)['referralIntake'],
): ClinicQuestionnaireFlowContext {
  return {
    questions: fixture.questions.map((question) => ({ ...question })),
    options: fixture.options.map((option) => ({ ...option })),
    constraints: fixture.constraints.map((constraint) => ({ ...constraint })),
  };
}

export const CLINIC_QUESTIONNAIRE_ANSWER_SCENARIOS: Array<{
  id: string;
  answers: ClinicQuestionnaireAnswerMap;
  expectedInitialQuestionId: string;
  expectedNextAfterReferralYes: string | null;
  expectedNextAfterReferralNo: string | null;
}> = [
  {
    id: 'referral-yes-shows-name',
    answers: { 'q-referral': ['opt-yes'] },
    expectedInitialQuestionId: 'q-referral',
    expectedNextAfterReferralYes: 'q-referrer-name',
    expectedNextAfterReferralNo: 'q-symptoms',
  },
  {
    id: 'referral-no-skips-name',
    answers: { 'q-referral': ['opt-no'] },
    expectedInitialQuestionId: 'q-referral',
    expectedNextAfterReferralYes: 'q-referrer-name',
    expectedNextAfterReferralNo: 'q-symptoms',
  },
];

export const CLINIC_QUESTIONNAIRE_VALIDATION_SCENARIOS: Array<{
  id: string;
  questionId: string;
  answers: ClinicQuestionnaireAnswerMap;
  expectErrors: boolean;
}> = [
  {
    id: 'referral-choice-required',
    questionId: 'q-referral',
    answers: { 'q-referral': [] },
    expectErrors: true,
  },
  {
    id: 'referral-choice-valid-yes',
    questionId: 'q-referral',
    answers: { 'q-referral': ['yes'] },
    expectErrors: false,
  },
  {
    id: 'referral-name-too-long',
    questionId: 'q-referrer-name',
    answers: { 'q-referrer-name': ['x'.repeat(121)] },
    expectErrors: true,
  },
  {
    id: 'symptoms-valid',
    questionId: 'q-symptoms',
    answers: { 'q-symptoms': ['Mild headache for two days'] },
    expectErrors: false,
  },
];

export const CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD = {
  code: 'referral-intake',
  internalName: 'Referral intake',
  title: 'Referral intake questionnaire',
  introTitle: 'Before your visit',
  introBody: 'Answer a few questions about your referral.',
} as const;

export const CLINIC_QUESTIONNAIRE_DEFINITION_PAYLOAD = {
  questions: [
    {
      key: 'referral',
      sequence: 1,
      type: 'choice',
      text: 'Were you referred by an external doctor?',
      required: true,
      validationErrorMessage: 'Please choose yes or no.',
      answerOptions: [
        { display: 'Yes', value: 'yes', sequence: 1 },
        { display: 'No', value: 'no', sequence: 2 },
      ],
    },
    {
      key: 'referrerName',
      sequence: 2,
      type: 'string',
      text: 'Referring doctor name',
      placeholder: 'Dr Smith',
      required: true,
      maxLength: 120,
      validationErrorMessage: 'Enter the referring doctor name.',
    },
    {
      key: 'symptoms',
      sequence: 3,
      type: 'text',
      text: 'Describe your symptoms',
      required: true,
      maxLength: 500,
      validationErrorMessage: 'Symptoms are required.',
    },
  ],
  constraints: [
    {
      questionKey: 'referrerName',
      constraintQuestionKey: 'referral',
      answerOptionValue: 'yes',
    },
  ],
} as const;
