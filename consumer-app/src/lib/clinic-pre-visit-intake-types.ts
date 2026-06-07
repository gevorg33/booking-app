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

export interface PreVisitIntakeFlowView {
  id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  responseId: string | null;
  introTitle: string | null;
  introBody: string | null;
  answers: Record<string, string[]>;
  nextQuestion: PreVisitIntakeQuestionView | null;
  isCompleted: boolean;
  questionnaire: {
    id: string;
    title: string;
    code: string;
    revision: number;
  };
}
