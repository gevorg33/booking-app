export interface BusinessWhatsAppIntegration {
  phoneNumberId?: string;
  businessAccountId?: string;
  accessTokenEnc?: string;
  templateConfirmation?: string;
  templateReminder?: string;
  templateLanguage?: string;
  templateBodyParams?: number;
  templateReminderBodyParams?: number;
  fallbackTemplate?: string;
  fallbackLanguage?: string;
  fallbackBodyParams?: number;
}

export interface WhatsAppRuntimeConfig {
  source: 'business' | 'platform';
  accessToken: string;
  phoneNumberId: string;
  wabaId?: string;
  apiVersion: string;
  templateConfirmation: string;
  templateReminder: string;
  templateCancellation?: string;
  templateLanguage: string;
  templateBodyParamCount: number;
  reminderBodyParamCount: number;
  cancellationBodyParamCount?: number;
  fallbackTemplate: string;
  fallbackLanguage: string;
  fallbackBodyParamCount: number;
}

export interface WhatsAppIntegrationPublicView {
  configured: boolean;
  source: 'business' | 'platform' | null;
  phoneNumberId?: string;
  businessAccountId?: string;
  hasAccessToken: boolean;
  accessTokenHint?: string;
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
  templateBodyParams: number;
  templateReminderBodyParams: number;
  fallbackTemplate: string;
  fallbackLanguage: string;
  fallbackBodyParams: number;
  usingPlatformDefault: boolean;
}

export const DEFAULT_WHATSAPP_INTEGRATION: Required<
  Pick<
    BusinessWhatsAppIntegration,
    | 'templateConfirmation'
    | 'templateReminder'
    | 'templateLanguage'
    | 'templateBodyParams'
    | 'templateReminderBodyParams'
    | 'fallbackTemplate'
    | 'fallbackLanguage'
    | 'fallbackBodyParams'
  >
> = {
  templateConfirmation: 'appointment_confirmation',
  templateReminder: 'appointment_reminder',
  templateLanguage: 'en',
  templateBodyParams: 4,
  templateReminderBodyParams: 3,
  fallbackTemplate: 'hello_world',
  fallbackLanguage: 'en_US',
  fallbackBodyParams: 0,
};

export function mergeBusinessWhatsAppIntegration(
  raw?: Record<string, unknown>,
): BusinessWhatsAppIntegration {
  const { defaultCountryCode: _legacy, ...rest } = (raw || {}) as BusinessWhatsAppIntegration & {
    defaultCountryCode?: string;
  };
  return {
    ...DEFAULT_WHATSAPP_INTEGRATION,
    ...rest,
  };
}

export function getBusinessWhatsAppIntegration(
  settings?: Record<string, unknown>,
): BusinessWhatsAppIntegration {
  const integrations = settings?.integrations as Record<string, unknown> | undefined;
  return mergeBusinessWhatsAppIntegration(integrations?.whatsapp as Record<string, unknown>);
}
