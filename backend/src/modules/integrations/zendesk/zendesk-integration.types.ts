export interface BusinessZendeskIntegration {
  enabled?: boolean;
  subdomain?: string;
  /** Agent/admin email used with the API token (email/token auth) */
  apiUserEmail?: string;
  apiTokenEnc?: string;
  /** Zendesk Web Widget key (safe to expose client-side when widget enabled) */
  widgetKey?: string;
  widgetEnabledOnDashboard?: boolean;
  widgetEnabledOnPublicBooking?: boolean;
  /** Auto-sync customers to Zendesk users on create/update */
  syncCustomersEnabled?: boolean;
  /** Create a Zendesk ticket when a customer review is submitted */
  createTicketOnReview?: boolean;
  /** Only create review tickets at or below this star rating (1–5). Omit for all reviews. */
  reviewTicketMaxRating?: number;
  /** Email of agent to assign new tickets (optional) */
  defaultAssigneeEmail?: string;
}

export interface ZendeskIntegrationPublicView {
  configured: boolean;
  enabled: boolean;
  subdomain?: string;
  apiUserEmail?: string;
  hasApiToken: boolean;
  apiTokenHint?: string;
  widgetKey?: string;
  widgetEnabledOnDashboard: boolean;
  widgetEnabledOnPublicBooking: boolean;
  syncCustomersEnabled: boolean;
  createTicketOnReview: boolean;
  reviewTicketMaxRating?: number;
  defaultAssigneeEmail?: string;
}

export interface ZendeskPublicWidgetConfig {
  widgetKey: string;
}

export interface ZendeskDashboardWidgetContext {
  widgetKey: string | null;
  subdomain?: string;
}

export function getBusinessZendeskIntegration(
  settings?: Record<string, unknown>,
): BusinessZendeskIntegration {
  const integrations = settings?.integrations as
    | Record<string, unknown>
    | undefined;
  return (integrations?.zendesk as BusinessZendeskIntegration) || {};
}
