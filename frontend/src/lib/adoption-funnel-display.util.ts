export interface AdoptionFunnelStepView {
  step: string;
  count: number;
  conversionFromPrevious: number | null;
  dropOffFromPrevious: number | null;
}

export interface AdoptionFunnelBreakdownView {
  dimension: 'platform' | 'locale' | 'tenantSlug';
  value: string;
  steps: AdoptionFunnelStepView[];
}

export type AdoptionFunnelDimension = AdoptionFunnelBreakdownView['dimension'];

const FUNNEL_DIMENSIONS: AdoptionFunnelDimension[] = [
  'platform',
  'locale',
  'tenantSlug',
];

export function formatAdoptionFunnelStepLabel(step: string): string {
  return step.replace(/_/g, ' ');
}

export function groupAdoptionFunnelBreakdowns(
  breakdowns: AdoptionFunnelBreakdownView[],
): Array<{ dimension: AdoptionFunnelDimension; items: AdoptionFunnelBreakdownView[] }> {
  return FUNNEL_DIMENSIONS.map((dimension) => ({
    dimension,
    items: breakdowns.filter((entry) => entry.dimension === dimension),
  })).filter((group) => group.items.length > 0);
}

export function findWorstDropOffStep(
  steps: AdoptionFunnelStepView[],
): AdoptionFunnelStepView | null {
  let worst: AdoptionFunnelStepView | null = null;
  for (const step of steps) {
    if (step.dropOffFromPrevious == null) continue;
    if (
      !worst ||
      (step.dropOffFromPrevious ?? 0) > (worst.dropOffFromPrevious ?? 0)
    ) {
      worst = step;
    }
  }
  return worst;
}
