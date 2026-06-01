export interface BusinessStripeIntegration {
  connectAccountId?: string;
  connectCountry?: string;
}

export interface StripeIntegrationPublicView {
  configured: boolean;
  connectAccountId?: string;
  connectCountry?: string;
  accountType?: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  displayName?: string;
}

export function getBusinessStripeIntegration(
  settings?: Record<string, unknown>,
): BusinessStripeIntegration {
  const integrations = settings?.integrations as Record<string, unknown> | undefined;
  const raw = integrations?.stripe as BusinessStripeIntegration | undefined;
  return {
    connectAccountId: raw?.connectAccountId?.trim() || undefined,
    connectCountry: raw?.connectCountry?.trim().toUpperCase() || undefined,
  };
}

export function isValidConnectAccountId(value: string): boolean {
  return /^acct_[a-zA-Z0-9]+$/.test(value.trim());
}
