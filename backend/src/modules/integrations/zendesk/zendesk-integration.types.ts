export interface BusinessZendeskIntegration {
  enabled?: boolean;
  subdomain?: string;
  apiTokenEnc?: string;
  /** Zendesk Web Widget key (safe to expose client-side when widget enabled) */
  widgetKey?: string;
  widgetEnabledOnDashboard?: boolean;
  widgetEnabledOnPublicBooking?: boolean;
  /** Auto-sync customers to Zendesk users on create/update */
  syncCustomersEnabled?: boolean;
  /** Email of agent to assign new tickets (optional) */
  defaultAssigneeEmail?: string;
}

export interface ZendeskIntegrationPublicView {
  configured: boolean;
  enabled: boolean;
  subdomain?: string;
  hasApiToken: boolean;
  apiTokenHint?: string;
  widgetKey?: string;
  widgetEnabledOnDashboard: boolean;
  widgetEnabledOnPublicBooking: boolean;
  syncCustomersEnabled: boolean;
  defaultAssigneeEmail?: string;
}

export interface ZendeskPublicWidgetConfig {
  widgetKey: string;
}

export function getBusinessZendeskIntegration(
  settings?: Record<string, unknown>,
): BusinessZendeskIntegration {
  const integrations = settings?.integrations as Record<string, unknown> | undefined;
  return (integrations?.zendesk as BusinessZendeskIntegration) || {};
}
