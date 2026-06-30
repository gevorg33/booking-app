import type { ClinicLabReviewStepAction } from './ai-clinic-lab-review-compound.util.js';

export type ClinicLabReviewCompoundFixture = {
  id: string;
  prompt: string;
  orderedActions: readonly ClinicLabReviewStepAction[];
  expectedParams?: Record<string, unknown>;
  misclassifiedAction?: string;
};

export const CLINIC_LAB_REVIEW_COMPOUND_PROMPTS: ClinicLabReviewCompoundFixture[] = [
  {
    id: 'lab-review-maria-en',
    prompt:
      'Lab review for Maria: list abnormal flagged measurements and explain her lab results in plain language',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Maria' },
    misclassifiedAction: 'explain_patient_results',
  },
  {
    id: 'list-abnormal-explain-john-en',
    prompt:
      'List abnormal results for John and then explain his lab results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'John' },
    misclassifiedAction: 'list_abnormal_results',
  },
  {
    id: 'review-flagged-anna-en',
    prompt:
      'Review flagged lab results for Anna; show abnormal measurements; explain what they mean',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Anna' },
  },
  {
    id: 'abnormal-review-sofia-en',
    prompt:
      'Show abnormal lab results for Sofia and explain her released results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Sofia' },
  },
  {
    id: 'flagged-results-alex-en',
    prompt:
      'List flagged abnormal results for Alex, then summarize his lab results for the patient chart',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Alex' },
  },
  {
    id: 'lab-review-order-abc-en',
    prompt:
      'Lab review for order #abc123 — list abnormal measurements and explain the results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { orderId: 'abc123' },
  },
  {
    id: 'review-abnormal-elena-en',
    prompt:
      'Review abnormal results for Elena and explain her CBC results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Elena' },
  },
  {
    id: 'flagged-review-david-en',
    prompt:
      'Flagged results review: list abnormal labs for David; explain his test results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'David' },
  },
  {
    id: 'abnormal-then-explain-nina-en',
    prompt:
      'List abnormal results for Nina and also explain her lab results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Nina' },
  },
  {
    id: 'review-flagged-leo-en',
    prompt:
      'Review flagged lab results end-to-end for Leo — show abnormal flags then explain results',
    orderedActions: ['list_abnormal_results', 'explain_patient_results'] as const,
    expectedParams: { customerName: 'Leo' },
  },
];

export const CLINIC_LAB_REVIEW_EN_SCENARIO_IDS =
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS.map((row) => row.id);

export const CLINIC_LAB_REVIEW_RESCUE_SCENARIOS =
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS.filter(
    (scenario) =>
      'misclassifiedAction' in scenario && !!scenario.misclassifiedAction,
  ) as Array<ClinicLabReviewCompoundFixture & { misclassifiedAction: string }>;
