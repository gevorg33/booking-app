export const CLINIC_QUESTION_TYPES = [
  'string',
  'text',
  'integer',
  'decimal',
  'group',
  'display',
  'dropdown',
  'choice',
  'multiple_choice',
  'date',
] as const;

export type ClinicQuestionType = (typeof CLINIC_QUESTION_TYPES)[number];

export const CLINIC_QUESTIONNAIRE_STATUSES = ['draft', 'published'] as const;
export type ClinicQuestionnaireStatus =
  (typeof CLINIC_QUESTIONNAIRE_STATUSES)[number];

export const CLINIC_QUESTION_VALIDATION_MAX_DATES = [
  'none',
  'today',
  'yesterday',
] as const;
export type ClinicQuestionValidationMaxDate =
  (typeof CLINIC_QUESTION_VALIDATION_MAX_DATES)[number];

export const CLINIC_QUESTIONNAIRE_RESPONSE_STATUSES = [
  'in_progress',
  'completed',
] as const;
export type ClinicQuestionnaireResponseStatus =
  (typeof CLINIC_QUESTIONNAIRE_RESPONSE_STATUSES)[number];

export type ClinicQuestionnaireAnswerMap = Record<string, string[]>;

export interface ClinicQuestionnaireQuestionDefinition {
  id: string;
  parentQuestionId: string | null;
  sequence: number;
  type: ClinicQuestionType;
  text: string | null;
  subText: string | null;
  placeholder: string | null;
  required: boolean;
  repeatEnabled: boolean;
  maxLength: number | null;
  maxCount: number | null;
  regexPattern: string | null;
  validationErrorMessage: string | null;
  validationMaxDate: ClinicQuestionValidationMaxDate;
}

export interface ClinicQuestionnaireAnswerOptionDefinition {
  id: string;
  questionId: string;
  display: string;
  value: string;
  sequence: number;
}

export interface ClinicQuestionnaireConstraintDefinition {
  id: string;
  questionnaireId: string;
  questionId: string;
  constraintQuestionId: string;
  answerOptionId: string | null;
  staticAnswer: string | null;
}

export interface ClinicQuestionnaireFlowQuestionView {
  id: string;
  type: ClinicQuestionType;
  text: string | null;
  subText: string | null;
  placeholder: string | null;
  required: boolean;
  repeatEnabled: boolean;
  validation: {
    maxLength: number | null;
    maxCount: number | null;
    regex: string | null;
    errorMessage: string | null;
    maxDate: ClinicQuestionValidationMaxDate;
  };
  answerOptions: Array<{
    id: string;
    display: string;
    value: string;
    sequence: number;
  }>;
  childQuestions?: ClinicQuestionnaireFlowQuestionView[];
}

export function isChoiceQuestionType(type: ClinicQuestionType): boolean {
  return type === 'choice' || type === 'dropdown' || type === 'multiple_choice';
}

export function isAnsweredQuestionType(type: ClinicQuestionType): boolean {
  return type !== 'display';
}
