import type { PreVisitIntakeFlowView } from './clinic-pre-visit-intake-types.js';

export interface PublicPreVisitIntakeQuestionnairePreview {
  id: string;
  title: string;
  code: string;
  introTitle: string | null;
  introBody: string | null;
}

export interface PublicPreVisitIntakeConfig {
  offersPreVisitIntake: boolean;
  questionnaire: PublicPreVisitIntakeQuestionnairePreview | null;
}

export type PublicPreVisitIntakeFlowView = PreVisitIntakeFlowView;

export interface PreVisitIntakeSummary {
  id: string;
  questionnaire: {
    id: string;
    title: string;
    code: string;
    revision: number;
  };
}

export function unwrapPublicPreVisitIntakeRecord<T>(payload: unknown): T {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as T;
}
