export type ProviderPreVisitIntakeStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'none';

export interface ProviderPreVisitIntakeAnswerRow {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface ProviderPreVisitIntakeSummary {
  visible: boolean;
  intakeId: string | null;
  questionnaireTitle: string | null;
  status: ProviderPreVisitIntakeStatus;
  completedAt: string | null;
  answers: ProviderPreVisitIntakeAnswerRow[];
  totalAnswerCount: number;
  hasMoreAnswers: boolean;
  dashboardFullAnswers: {
    path: string;
    bookingId: string;
    intakeId: string | null;
    canOpen: boolean;
  } | null;
}
