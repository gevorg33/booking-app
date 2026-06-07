export type PreVisitIntakeStatus = 'assigned' | 'in_progress' | 'completed';

export interface PreVisitIntakeQuestionView {
  id: string;
  type: string;
  text: string | null;
  subText: string | null;
  placeholder: string | null;
  required: boolean;
  validation: {
    maxLength: number | null;
    maxCount: number | null;
    regex: string | null;
    errorMessage: string | null;
    maxDate: string;
  };
  answerOptions: Array<{
    id: string;
    display: string;
    value: string;
    sequence: number;
  }>;
}

export interface PreVisitIntakeSummary {
  id: string;
  businessId: string;
  customerId: string;
  bookingId: string | null;
  questionnaireId: string;
  responseId: string | null;
  status: PreVisitIntakeStatus;
  assignedByEmployeeId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionnaire: {
    id: string;
    title: string;
    code: string;
    revision: number;
  };
}

export interface PreVisitIntakeFlowView extends PreVisitIntakeSummary {
  introTitle: string | null;
  introBody: string | null;
  answers: Record<string, string[]>;
  nextQuestion: PreVisitIntakeQuestionView | null;
  isCompleted: boolean;
}

export function unwrapPreVisitIntakeRecord<T>(payload: unknown): T {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as T;
}

export function unwrapPreVisitIntakeList(payload: unknown): PreVisitIntakeSummary[] {
  const root = unwrapPreVisitIntakeRecord<unknown>(payload);
  return Array.isArray(root) ? (root as PreVisitIntakeSummary[]) : [];
}

export function preVisitIntakeStatusLabelKey(status: PreVisitIntakeStatus): string {
  return `clinic.intakeForm.status.${status}`;
}
