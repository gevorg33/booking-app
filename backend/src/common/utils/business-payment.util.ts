/** Business payment settings (prov-exp-2.3 — tips placeholder). */

export interface BusinessPaymentSettings {
  tipsEnabled: boolean;
}

export const DEFAULT_BUSINESS_PAYMENT_SETTINGS: BusinessPaymentSettings = {
  tipsEnabled: false,
};

export function readBusinessPaymentSettings(
  settings?: Record<string, unknown> | null,
): BusinessPaymentSettings {
  const raw = (settings?.payment as Record<string, unknown> | undefined) ?? {};
  return {
    tipsEnabled: raw.tipsEnabled === true,
  };
}

export function businessPaymentTipsEnabled(
  settings?: Record<string, unknown> | null,
): boolean {
  return readBusinessPaymentSettings(settings).tipsEnabled;
}
