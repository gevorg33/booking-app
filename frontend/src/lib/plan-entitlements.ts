export const PLAN_LIMIT_ERROR_CODE = 'PLAN_LIMIT_EXCEEDED';

export type PlanFeatureFlag =
  | 'stripeConnect'
  | 'promoCodes'
  | 'loyalty'
  | 'memberships'
  | 'giftCards';

export type PlanLimitKind = 'provider_seats' | 'ai_commands' | PlanFeatureFlag;

export interface PlanEntitlements {
  tierId: 'solo' | 'starter' | 'business';
  tierName: string;
  isPaid: boolean;
  subscriptionPlanId: string | null;
  limits: {
    tierId: string;
    tierName: string;
    maxProviderSeats: number;
    aiCommandsPerMonth: number;
    flags: Record<PlanFeatureFlag, boolean>;
  };
  usage: {
    providerSeats: number;
    aiCommandsThisMonth: number;
  };
  flags: Record<PlanFeatureFlag, boolean>;
  atLimit: {
    providerSeats: boolean;
    aiCommands: boolean;
  };
  aiUsageWarning: boolean;
}

export function isPlanLimitError(error: unknown): boolean {
  const data = (error as { response?: { data?: { code?: string } } })?.response?.data;
  return data?.code === PLAN_LIMIT_ERROR_CODE;
}

export function planLimitMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: { code?: string; message?: string } } })?.response
    ?.data;
  if (data?.code !== PLAN_LIMIT_ERROR_CODE) return null;
  const msg = data.message;
  return typeof msg === 'string' ? msg : null;
}

export const FEATURE_LABEL_KEYS: Record<PlanFeatureFlag, string> = {
  stripeConnect: 'billing.upgradeFeatureStripeConnect',
  promoCodes: 'billing.upgradeFeaturePromoCodes',
  loyalty: 'billing.upgradeFeatureLoyalty',
  memberships: 'billing.upgradeFeatureMemberships',
  giftCards: 'billing.upgradeFeatureGiftCards',
};
