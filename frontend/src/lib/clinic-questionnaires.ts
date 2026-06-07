export interface ClinicQuestionnaireSummary {
  id: string;
  businessId: string;
  code: string;
  internalName: string;
  title: string;
  introTitle: string | null;
  introBody: string | null;
  revision: number;
  status: string;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicQuestionnaireDefinition extends ClinicQuestionnaireSummary {
  questions: Array<{
    id: string;
    type: string;
    text: string | null;
    required: boolean;
    answerOptions: Array<{
      id: string;
      display: string;
      value: string;
      sequence: number;
    }>;
  }>;
  constraints: unknown[];
}

export interface ClinicQuestionnaireFormState {
  code: string;
  internalName: string;
  title: string;
  introTitle: string;
  introBody: string;
}

export const REFERRAL_INTAKE_DEFINITION = {
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

export function defaultClinicQuestionnaireForm(
  overrides: Partial<ClinicQuestionnaireFormState> = {},
): ClinicQuestionnaireFormState {
  return {
    code: '',
    internalName: '',
    title: '',
    introTitle: '',
    introBody: '',
    ...overrides,
  };
}

export function clinicQuestionnaireFormToPayload(form: ClinicQuestionnaireFormState) {
  return {
    code: form.code.trim(),
    internalName: form.internalName.trim(),
    title: form.title.trim(),
    introTitle: form.introTitle.trim() || null,
    introBody: form.introBody.trim() || null,
  };
}

export function unwrapClinicQuestionnaireList(payload: unknown): ClinicQuestionnaireSummary[] {
  const root = (payload as { data?: unknown })?.data ?? payload;
  const nested = (root as { data?: unknown })?.data ?? root;
  return Array.isArray(nested) ? (nested as ClinicQuestionnaireSummary[]) : [];
}

export function unwrapClinicQuestionnaireRecord<T>(payload: unknown): T {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as T;
}

export function questionnaireStatusLabel(status: string): 'draft' | 'published' {
  return status === 'published' ? 'published' : 'draft';
}
