import type { PreVisitIntakeFlowView } from '@/lib/clinic-pre-visit-intake';

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

export function unwrapPublicPreVisitIntakeRecord<T>(payload: unknown): T {
  const root = (payload as { data?: unknown })?.data ?? payload;
  return root as T;
}

export function publicPreVisitIntakePaths(slug: string, intakeId?: string) {
  const base = `/public/${slug}/me/pre-visit-intake`;
  return {
    config: (serviceId: string) =>
      `/public/${slug}/checkout/pre-visit-intake/config?serviceId=${encodeURIComponent(serviceId)}`,
    draft: `${base}/draft`,
    flow: intakeId ? `${base}/${intakeId}` : null,
    start: intakeId ? `${base}/${intakeId}/start` : null,
    answers: intakeId ? `${base}/${intakeId}/answers` : null,
  };
}

export type PublicPreVisitIntakeFlowView = PreVisitIntakeFlowView;
