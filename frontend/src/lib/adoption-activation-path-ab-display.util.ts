export interface ActivationPathAbVariantScoreView {
  variant: string;
  qualifiedInstalls: number;
  qualifiedActivated: number;
  qualifiedActivationRate: number | null;
  sufficientSample: boolean;
}

export interface ActivationPathAbDimensionView {
  dimension: string;
  winner: string;
  promoted: string;
  promotionApplied: boolean;
  scores: ActivationPathAbVariantScoreView[];
}

export interface ActivationPathAbDashboardView {
  dimensions: ActivationPathAbDimensionView[];
  promoted: {
    signInPlacement: string;
    slotPreselection: string;
    paymentTiming: string;
  };
}

export function readActivationPathAbDashboard(
  data: { activationPathAb?: ActivationPathAbDashboardView | null } | null | undefined,
): ActivationPathAbDashboardView | null {
  if (!data?.activationPathAb?.dimensions?.length) return null;
  return data.activationPathAb;
}

export function formatActivationPathRate(rate: number | null): string {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatActivationPathDimensionLabel(dimension: string): string {
  switch (dimension) {
    case 'signInPlacement':
      return 'Sign-in placement';
    case 'slotPreselection':
      return 'Slot pre-selection';
    case 'paymentTiming':
      return 'Payment timing';
    default:
      return dimension;
  }
}

export function formatActivationPathVariantLabel(variant: string): string {
  switch (variant) {
    case 'post_booking':
      return 'Post-booking';
    case 'pre_confirm':
      return 'Pre-confirm';
    case 'nearest_auto':
      return 'Nearest auto';
    case 'manual_pick':
      return 'Manual pick';
    case 'pay_at_venue_default':
      return 'Pay at venue default';
    case 'online_first':
      return 'Online first';
    default:
      return variant;
  }
}
