export type NotificationEmailTemplateKey =
  | 'booking_confirmation'
  | 'booking_confirmation_grouped'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'review_request'
  | 'gift_card_recipient'
  | 'gift_card_purchaser_receipt';

export interface NotificationEmailTemplateVariable {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
}

export interface TenantCustomEmailVariable {
  key: string;
  label: string;
  defaultValue: string;
}

export interface TenantEmailTemplateOverride {
  enabled?: boolean;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
}

export interface TenantEmailTemplatesSettings {
  customVariables?: TenantCustomEmailVariable[];
  templates?: Partial<
    Record<NotificationEmailTemplateKey, TenantEmailTemplateOverride>
  >;
}

/** Normalized settings returned by readTenantEmailTemplatesSettings — always has defaults. */
export interface NormalizedTenantEmailTemplatesSettings {
  customVariables: TenantCustomEmailVariable[];
  templates: Partial<
    Record<NotificationEmailTemplateKey, TenantEmailTemplateOverride>
  >;
}

export interface ResolvedEmailTemplate {
  key: NotificationEmailTemplateKey;
  label: string;
  description: string;
  enabled: boolean;
  isCustomized: boolean;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: NotificationEmailTemplateVariable[];
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}
