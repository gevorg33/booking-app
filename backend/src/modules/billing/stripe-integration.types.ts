export type ConnectChargeModel = 'direct' | 'destination';
export type ConnectMode = 'oauth' | 'express' | 'manual';

export interface BusinessStripeIntegration {
  connectAccountId?: string;
  connectCountry?: string;
  connectMode?: ConnectMode;
  connectChargeModel?: ConnectChargeModel;
}

export interface StripeIntegrationPublicView {
  configured: boolean;
  connectAccountId?: string;
  connectCountry?: string;
  connectMode?: ConnectMode;
  connectChargeModel?: ConnectChargeModel;
  accountType?: string;
  oauthAvailable?: boolean;
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
    connectMode:
      raw?.connectMode === 'oauth' || raw?.connectMode === 'express' || raw?.connectMode === 'manual'
        ? raw.connectMode
        : undefined,
    connectChargeModel:
      raw?.connectChargeModel === 'direct' || raw?.connectChargeModel === 'destination'
        ? raw.connectChargeModel
        : undefined,
  };
}

export function isValidConnectAccountId(value: string): boolean {
  return /^acct_[a-zA-Z0-9]+$/.test(value.trim());
}

export function usesDestinationCharges(
  settings: Record<string, unknown> | undefined,
  platformDefault: ConnectChargeModel,
): boolean {
  const integration = getBusinessStripeIntegration(settings);
  if (integration.connectChargeModel === 'destination') return true;
  if (integration.connectChargeModel === 'direct') return false;
  return platformDefault === 'destination';
}
