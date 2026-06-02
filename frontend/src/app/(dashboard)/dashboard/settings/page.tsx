'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, MessageCircle, KeyRound } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PublicBookingSelfServiceSettings } from '@/components/settings/public-booking-self-service-settings';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useTheme } from '@/components/theme-provider';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { AppLocale } from '@/i18n';

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  sendConfirmationEmail: boolean;
  sendConfirmationWhatsapp: boolean;
  reminder24hEmail: boolean;
  reminder1hEmail: boolean;
  reminder24hSms: boolean;
  reminder1hSms: boolean;
  reminder24hWhatsapp: boolean;
  reminder1hWhatsapp: boolean;
  reminderImmediateWhatsapp: boolean;
  notifyBusinessOnCustomerBookingChange: boolean;
}

interface WhatsAppIntegrationSettings {
  configured: boolean;
  source: 'business' | 'platform' | null;
  phoneNumberId?: string;
  businessAccountId?: string;
  hasAccessToken: boolean;
  accessTokenHint?: string;
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
  usingPlatformDefault: boolean;
}

type WhatsAppConnectionMode = 'platform' | 'custom';

type OpenAiConnectionMode = 'platform' | 'custom';

interface AiUsageSummary {
  period: 'month';
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedPlatformCostUsd: number;
  bySurface: Array<{
    surface: string;
    requests: number;
    totalTokens: number;
    platformCostUsd: number;
  }>;
  byActorType: Array<{
    actorType: string;
    requests: number;
    totalTokens: number;
  }>;
}

interface OpenAiIntegrationSettings {
  configured: boolean;
  source: 'business' | 'platform' | null;
  hasApiKey: boolean;
  apiKeyHint?: string;
  usingPlatformDefault: boolean;
  usage: AiUsageSummary;
}

interface OpenAiIntegrationForm {
  apiKey: string;
  connectionMode: OpenAiConnectionMode;
}

interface WhatsAppIntegrationForm {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
  connectionMode: WhatsAppConnectionMode;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: true,
  sendConfirmationEmail: true,
  sendConfirmationWhatsapp: true,
  reminder24hEmail: true,
  reminder1hEmail: true,
  reminder24hSms: false,
  reminder1hSms: false,
  reminder24hWhatsapp: true,
  reminder1hWhatsapp: true,
  reminderImmediateWhatsapp: false,
  notifyBusinessOnCustomerBookingChange: false,
};

const DEFAULT_WHATSAPP_FORM: WhatsAppIntegrationForm = {
  phoneNumberId: '',
  businessAccountId: '',
  accessToken: '',
  templateConfirmation: 'appointment_confirmation',
  templateReminder: 'appointment_reminder',
  templateLanguage: 'en',
  connectionMode: 'platform',
};

const DEFAULT_OPENAI_FORM: OpenAiIntegrationForm = {
  apiKey: '',
  connectionMode: 'platform',
};

function normalizeNotificationSettings(
  raw: Partial<NotificationSettings> | undefined,
): NotificationSettings {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...raw,
    emailEnabled: raw?.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailEnabled,
    smsEnabled: raw?.smsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.smsEnabled,
    whatsappEnabled: raw?.whatsappEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.whatsappEnabled,
    sendConfirmationEmail:
      raw?.sendConfirmationEmail ?? DEFAULT_NOTIFICATION_SETTINGS.sendConfirmationEmail,
    sendConfirmationWhatsapp:
      raw?.sendConfirmationWhatsapp ?? DEFAULT_NOTIFICATION_SETTINGS.sendConfirmationWhatsapp,
    reminder24hEmail: raw?.reminder24hEmail ?? DEFAULT_NOTIFICATION_SETTINGS.reminder24hEmail,
    reminder1hEmail: raw?.reminder1hEmail ?? DEFAULT_NOTIFICATION_SETTINGS.reminder1hEmail,
    reminder24hSms: raw?.reminder24hSms ?? DEFAULT_NOTIFICATION_SETTINGS.reminder24hSms,
    reminder1hSms: raw?.reminder1hSms ?? DEFAULT_NOTIFICATION_SETTINGS.reminder1hSms,
    reminder24hWhatsapp:
      raw?.reminder24hWhatsapp ?? DEFAULT_NOTIFICATION_SETTINGS.reminder24hWhatsapp,
    reminder1hWhatsapp:
      raw?.reminder1hWhatsapp ?? DEFAULT_NOTIFICATION_SETTINGS.reminder1hWhatsapp,
    reminderImmediateWhatsapp:
      raw?.reminderImmediateWhatsapp ?? DEFAULT_NOTIFICATION_SETTINGS.reminderImmediateWhatsapp,
    notifyBusinessOnCustomerBookingChange:
      raw?.notifyBusinessOnCustomerBookingChange ??
      DEFAULT_NOTIFICATION_SETTINGS.notifyBusinessOnCustomerBookingChange,
  };
}

function whatsappConnectionModeFromApi(data: WhatsAppIntegrationSettings): WhatsAppConnectionMode {
  if (data.usingPlatformDefault) return 'platform';
  if (data.source === 'business') return 'custom';
  return 'platform';
}

function whatsappFormFromApi(data: WhatsAppIntegrationSettings): WhatsAppIntegrationForm {
  return {
    phoneNumberId: data.phoneNumberId ?? '',
    businessAccountId: data.businessAccountId ?? '',
    accessToken: '',
    templateConfirmation: data.templateConfirmation || 'appointment_confirmation',
    templateReminder: data.templateReminder || 'appointment_reminder',
    templateLanguage: data.templateLanguage || 'en',
    connectionMode: whatsappConnectionModeFromApi(data),
  };
}

function openAiConnectionModeFromApi(data: OpenAiIntegrationSettings): OpenAiConnectionMode {
  if (data.usingPlatformDefault) return 'platform';
  if (data.source === 'business') return 'custom';
  return 'platform';
}

function openAiFormFromApi(data: OpenAiIntegrationSettings): OpenAiIntegrationForm {
  return {
    apiKey: '',
    connectionMode: openAiConnectionModeFromApi(data),
  };
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatSurfaceLabel(surface: string, t: (key: string) => string): string {
  const key = `settings.openAiSurface_${surface}`;
  const translated = t(key);
  return translated !== key ? translated : surface.replace(/_/g, ' ');
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300"
      />
    </label>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm py-2">
      <span className="text-gray-700 dark:text-gray-300">
        {label}
        {required ? ' *' : ''}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function validateWhatsAppForm(
  form: WhatsAppIntegrationForm,
  hasSavedToken: boolean,
  t: (key: string) => string,
): string | null {
  if (form.connectionMode === 'platform') return null;

  if (!form.phoneNumberId.trim()) return t('settings.whatsappPhoneNumberIdRequired');
  if (!form.businessAccountId.trim()) return t('settings.whatsappBusinessAccountIdRequired');
  if (!form.accessToken.trim() && !hasSavedToken) return t('settings.whatsappAccessTokenRequired');
  if (!form.templateConfirmation.trim()) return t('settings.whatsappTemplateConfirmationRequired');
  if (!form.templateReminder.trim()) return t('settings.whatsappTemplateReminderRequired');
  if (!form.templateLanguage.trim()) return t('settings.whatsappTemplateLanguageRequired');

  return null;
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { user, setAuth, business, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [notif, setNotif] = useState<NotificationSettings | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppIntegrationForm>(DEFAULT_WHATSAPP_FORM);
  const [whatsappMeta, setWhatsappMeta] = useState<WhatsAppIntegrationSettings | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [openAi, setOpenAi] = useState<OpenAiIntegrationForm>(DEFAULT_OPENAI_FORM);
  const [openAiMeta, setOpenAiMeta] = useState<OpenAiIntegrationSettings | null>(null);
  const [openAiError, setOpenAiError] = useState<string | null>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notification-settings', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/notifications/settings`);
      return res.data || res;
    },
    enabled: !!business?.id,
  });

  const { data: whatsappData } = useQuery({
    queryKey: ['whatsapp-integration', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/notifications/whatsapp`);
      return (res.data || res) as WhatsAppIntegrationSettings;
    },
    enabled: !!business?.id,
  });

  const { data: openAiData } = useQuery({
    queryKey: ['openai-integration', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/integrations/openai`);
      return (res.data || res) as OpenAiIntegrationSettings;
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (notifData?.settings) {
      setNotif(normalizeNotificationSettings(notifData.settings));
    }
  }, [notifData]);

  useEffect(() => {
    if (whatsappData) {
      setWhatsappMeta(whatsappData);
      setWhatsapp(whatsappFormFromApi(whatsappData));
    }
  }, [whatsappData]);

  useEffect(() => {
    if (openAiData) {
      setOpenAiMeta(openAiData);
      setOpenAi(openAiFormFromApi(openAiData));
    }
  }, [openAiData]);

  const saveLocale = useMutation({
    mutationFn: async (nextLocale: AppLocale) => {
      const { data } = await api.patch('/auth/preferences', { locale: nextLocale });
      return data.data || data;
    },
    onSuccess: (result) => {
      if (user && business && token) {
        setAuth({ ...user, locale: result.user.locale }, business, token);
      }
    },
  });

  const saveNotifications = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put(
        `/businesses/${business!.id}/notifications/settings`,
        notif,
      );
      return res.data || res;
    },
    onSuccess: (result) => {
      const payload = result?.settings ?? result?.data?.settings ?? result;
      if (payload) setNotif(normalizeNotificationSettings(payload));
      queryClient.invalidateQueries({ queryKey: ['notification-settings', business?.id] });
    },
  });

  const saveWhatsApp = useMutation({
    mutationFn: async (form: WhatsAppIntegrationForm) => {
      if (form.connectionMode === 'platform') {
        const { data: res } = await api.put(
          `/businesses/${business!.id}/notifications/whatsapp`,
          { usePlatformDefault: true },
        );
        return (res.data || res) as WhatsAppIntegrationSettings;
      }

      const validationError = validateWhatsAppForm(
        form,
        Boolean(whatsappMeta?.hasAccessToken),
        t,
      );
      if (validationError) {
        throw new Error(validationError);
      }

      const payload: Record<string, unknown> = {
        phoneNumberId: form.phoneNumberId.trim(),
        businessAccountId: form.businessAccountId.trim(),
        templateConfirmation: form.templateConfirmation.trim(),
        templateReminder: form.templateReminder.trim(),
        templateLanguage: form.templateLanguage.trim(),
      };
      if (form.accessToken.trim()) {
        payload.accessToken = form.accessToken.trim();
      }
      const { data: res } = await api.put(
        `/businesses/${business!.id}/notifications/whatsapp`,
        payload,
      );
      return (res.data || res) as WhatsAppIntegrationSettings;
    },
    onSuccess: (result) => {
      setWhatsappError(null);
      setWhatsappMeta(result);
      setWhatsapp(whatsappFormFromApi(result));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-integration', business?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-settings', business?.id] });
    },
    onError: (err) => {
      setWhatsappError(err instanceof Error ? err.message : t('errors.saveFailed'));
    },
  });

  const saveOpenAi = useMutation({
    mutationFn: async (form: OpenAiIntegrationForm) => {
      if (form.connectionMode === 'platform') {
        const { data: res } = await api.put(
          `/businesses/${business!.id}/integrations/openai`,
          { usePlatformDefault: true },
        );
        return (res.data || res) as OpenAiIntegrationSettings;
      }

      if (!form.apiKey.trim() && !openAiMeta?.hasApiKey) {
        throw new Error(t('settings.openAiApiKeyRequired'));
      }

      const payload: Record<string, unknown> = {};
      if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim();

      const { data: res } = await api.put(
        `/businesses/${business!.id}/integrations/openai`,
        payload,
      );
      return (res.data || res) as OpenAiIntegrationSettings;
    },
    onSuccess: (result) => {
      setOpenAiError(null);
      setOpenAiMeta(result);
      setOpenAi(openAiFormFromApi(result));
      queryClient.invalidateQueries({ queryKey: ['openai-integration', business?.id] });
    },
    onError: (err) => {
      setOpenAiError(err instanceof Error ? err.message : t('errors.saveFailed'));
    },
  });

  const whatsappStatusLabel = () => {
    if (!notifData?.providers?.whatsappConfigured) {
      return t('settings.whatsappDevMode');
    }
    if (notifData.providers.whatsappUsingPlatformDefault) {
      return t('settings.whatsappUsingPlatformDefault');
    }
    return t('settings.whatsappUsingOwnAccount');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <Settings className="w-6 h-6 text-blue-400" />
        {t('settings.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t('settings.subtitle')}</p>

      <div className="card space-y-6">
        <div>
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('settings.themeSection')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.themeDescription')}</p>
          <ThemeSwitcher />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('settings.notificationsSection')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('settings.notificationsDescription')}</p>
          {notifData?.providers && (
            <p className="text-xs text-gray-500 mb-4">
              {notifData.providers.emailConfigured
                ? t('settings.emailConfigured')
                : t('settings.emailDevMode')}
              {' · '}
              {whatsappStatusLabel()}
              {' · '}
              {notifData.providers.smsConfigured
                ? t('settings.smsConfigured')
                : t('settings.smsDevMode')}
            </p>
          )}
          {notif && (
            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
              <ToggleRow label={t('settings.confirmationEmail')} checked={notif.sendConfirmationEmail} onChange={(v) => setNotif({ ...notif, sendConfirmationEmail: v })} />
              <ToggleRow label={t('settings.confirmationWhatsapp')} checked={notif.sendConfirmationWhatsapp} onChange={(v) => setNotif({ ...notif, sendConfirmationWhatsapp: v })} />
              <ToggleRow label={t('settings.reminderImmediateWhatsapp')} checked={notif.reminderImmediateWhatsapp} onChange={(v) => setNotif({ ...notif, reminderImmediateWhatsapp: v })} />
              <ToggleRow label={t('settings.reminder24hEmail')} checked={notif.reminder24hEmail} onChange={(v) => setNotif({ ...notif, reminder24hEmail: v })} />
              <ToggleRow label={t('settings.reminder1hEmail')} checked={notif.reminder1hEmail} onChange={(v) => setNotif({ ...notif, reminder1hEmail: v })} />
              <ToggleRow label={t('settings.reminder24hWhatsapp')} checked={notif.reminder24hWhatsapp} onChange={(v) => setNotif({ ...notif, reminder24hWhatsapp: v })} />
              <ToggleRow label={t('settings.reminder1hWhatsapp')} checked={notif.reminder1hWhatsapp} onChange={(v) => setNotif({ ...notif, reminder1hWhatsapp: v })} />
              <ToggleRow label={t('settings.reminder24hSms')} checked={notif.reminder24hSms} onChange={(v) => setNotif({ ...notif, reminder24hSms: v })} />
              <ToggleRow label={t('settings.reminder1hSms')} checked={notif.reminder1hSms} onChange={(v) => setNotif({ ...notif, reminder1hSms: v })} />
              <ToggleRow
                label={t('settings.notifyBusinessOnCustomerBookingChange')}
                checked={notif.notifyBusinessOnCustomerBookingChange}
                onChange={(v) => setNotif({ ...notif, notifyBusinessOnCustomerBookingChange: v })}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => saveNotifications.mutate()}
            disabled={!notif || saveNotifications.isPending}
            className="btn-primary mt-4 text-sm"
          >
            {saveNotifications.isPending ? 'Saving…' : t('settings.saveNotifications')}
          </button>
          {saveNotifications.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">{t('settings.notificationsSaved')}</p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            {t('settings.whatsappIntegrationSection')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('settings.whatsappIntegrationDescription')}
          </p>
          {whatsappMeta && (
            <p className="text-xs text-gray-500 mb-4">
              {whatsappMeta.usingPlatformDefault
                ? t('settings.whatsappUsingPlatformDefault')
                : whatsappMeta.source === 'business'
                  ? t('settings.whatsappUsingOwnAccount')
                  : t('settings.whatsappDevMode')}
            </p>
          )}
          <div className="space-y-1">
            <FieldRow label={t('settings.whatsappConnectionMode')}>
              <select
                value={whatsapp.connectionMode}
                disabled={saveWhatsApp.isPending}
                onChange={(e) => {
                  const connectionMode = e.target.value as WhatsAppConnectionMode;
                  setWhatsappError(null);
                  const next = { ...whatsapp, connectionMode };
                  setWhatsapp(next);
                  if (connectionMode === 'platform') {
                    saveWhatsApp.mutate(next);
                  }
                }}
                className="input w-full text-sm"
              >
                <option value="platform">{t('settings.whatsappModePlatform')}</option>
                <option value="custom">{t('settings.whatsappModeCustom')}</option>
              </select>
            </FieldRow>
            {whatsapp.connectionMode === 'custom' && (
              <>
                <FieldRow label={t('settings.whatsappPhoneNumberId')} required>
                  <input
                    type="text"
                    required
                    value={whatsapp.phoneNumberId}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumberId: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappBusinessAccountId')} required>
                  <input
                    type="text"
                    required
                    value={whatsapp.businessAccountId}
                    onChange={(e) => setWhatsapp({ ...whatsapp, businessAccountId: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappAccessToken')} required={!whatsappMeta?.hasAccessToken}>
                  {whatsappMeta?.hasAccessToken && whatsappMeta.accessTokenHint && (
                    <p className="text-xs text-gray-500 mb-1">
                      {t('settings.whatsappAccessTokenHint')}: {whatsappMeta.accessTokenHint}
                    </p>
                  )}
                  <input
                    type="password"
                    required={!whatsappMeta?.hasAccessToken}
                    value={whatsapp.accessToken}
                    onChange={(e) => setWhatsapp({ ...whatsapp, accessToken: e.target.value })}
                    placeholder={
                      whatsappMeta?.hasAccessToken
                        ? t('settings.whatsappAccessTokenPlaceholder')
                        : t('settings.whatsappAccessTokenRequiredPlaceholder')
                    }
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateConfirmation')} required>
                  <input
                    type="text"
                    required
                    value={whatsapp.templateConfirmation}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateConfirmation: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateReminder')} required>
                  <input
                    type="text"
                    required
                    value={whatsapp.templateReminder}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateReminder: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateLanguage')} required>
                  <input
                    type="text"
                    required
                    value={whatsapp.templateLanguage}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateLanguage: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
              </>
            )}
          </div>
          {whatsappError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{whatsappError}</p>
          )}
          {whatsapp.connectionMode === 'platform' && saveWhatsApp.isPending && (
            <p className="text-sm text-gray-500 mt-3">{t('common.saving')}</p>
          )}
          {whatsapp.connectionMode === 'custom' && (
            <button
              type="button"
              onClick={() => saveWhatsApp.mutate(whatsapp)}
              disabled={saveWhatsApp.isPending}
              className="btn-primary mt-4 text-sm"
            >
              {saveWhatsApp.isPending ? 'Saving…' : t('settings.saveWhatsAppIntegration')}
            </button>
          )}
          {saveWhatsApp.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {t('settings.whatsappIntegrationSaved')}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            {t('settings.openAiSection')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('settings.openAiDescription')}
          </p>
          {openAiMeta && (
            <p className="text-xs text-gray-500 mb-4">
              {openAiMeta.usingPlatformDefault
                ? t('settings.openAiUsingPlatformDefault')
                : openAiMeta.source === 'business'
                  ? t('settings.openAiUsingOwnKey')
                  : t('settings.openAiNotConfigured')}
            </p>
          )}

          <FieldRow label={t('settings.openAiConnectionMode')}>
            <select
              className="input w-full"
              value={openAi.connectionMode}
              disabled={saveOpenAi.isPending}
              onChange={(e) => {
                const connectionMode = e.target.value as OpenAiConnectionMode;
                setOpenAiError(null);
                const next = { ...openAi, connectionMode };
                setOpenAi(next);
                if (connectionMode === 'platform') {
                  saveOpenAi.mutate(next);
                }
              }}
            >
              <option value="platform">{t('settings.openAiModePlatform')}</option>
              <option value="custom">{t('settings.openAiModeCustom')}</option>
            </select>
          </FieldRow>

          {openAi.connectionMode === 'custom' && (
            <FieldRow label={t('settings.openAiApiKey')} required={!openAiMeta?.hasApiKey}>
              {openAiMeta?.hasApiKey && openAiMeta.apiKeyHint && (
                <p className="text-xs text-gray-500 mb-1">
                  {t('settings.openAiApiKeyHint')}: {openAiMeta.apiKeyHint}
                </p>
              )}
              <input
                type="password"
                className="input w-full"
                required={!openAiMeta?.hasApiKey}
                value={openAi.apiKey}
                onChange={(e) => setOpenAi({ ...openAi, apiKey: e.target.value })}
                placeholder={
                  openAiMeta?.hasApiKey
                    ? t('settings.openAiApiKeyPlaceholder')
                    : t('settings.openAiApiKeyRequiredPlaceholder')
                }
                autoComplete="off"
              />
            </FieldRow>
          )}

          {openAiMeta?.usage && (
            <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('settings.openAiUsageTitle')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('settings.openAiUsagePeriod')}: {openAiMeta.usage.periodStart} → {openAiMeta.usage.periodEnd}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">{t('settings.openAiUsageRequests')}</p>
                  <p className="font-medium">{openAiMeta.usage.totalRequests}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{t('settings.openAiUsageTokens')}</p>
                  <p className="font-medium">{openAiMeta.usage.totalTokens.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">{t('settings.openAiUsagePlatformCost')}</p>
                  <p className="font-medium">{formatUsd(openAiMeta.usage.estimatedPlatformCostUsd)}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.openAiUsagePlatformCostHint')}</p>
                </div>
              </div>
              {openAiMeta.usage.bySurface.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {t('settings.openAiUsageBySurface')}
                  </p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    {openAiMeta.usage.bySurface.map((row) => (
                      <li key={row.surface} className="flex justify-between gap-2">
                        <span>{formatSurfaceLabel(row.surface, t)}</span>
                        <span>
                          {row.totalTokens.toLocaleString()} {t('settings.openAiUsageTokensShort')}
                          {row.platformCostUsd > 0 ? ` · ${formatUsd(row.platformCostUsd)}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {openAiError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{openAiError}</p>
          )}
          {openAi.connectionMode === 'platform' && saveOpenAi.isPending && (
            <p className="text-sm text-gray-500 mt-3">{t('settings.openAiSaving')}</p>
          )}
          {openAi.connectionMode === 'custom' && (
            <button
              type="button"
              onClick={() => saveOpenAi.mutate(openAi)}
              disabled={saveOpenAi.isPending}
              className="btn-primary mt-4 text-sm"
            >
              {saveOpenAi.isPending ? 'Saving…' : t('settings.saveOpenAiIntegration')}
            </button>
          )}
          {saveOpenAi.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {t('settings.openAiIntegrationSaved')}
            </p>
          )}
        </div>

        {business?.id && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <PublicBookingSelfServiceSettings businessId={business.id} />
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('settings.languageSection')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('languages.description')}</p>
          <LanguageSwitcher
            onChange={(next) => {
              saveLocale.mutate(next);
            }}
          />
          {saveLocale.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-3">{t('languages.saved')}</p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-sm text-gray-500">
          <p>
            {t('settings.account')}: {user?.email}
          </p>
          <p className="mt-1">
            {t('settings.dashboardLanguage')}: {locale.toUpperCase()}
          </p>
          <p className="mt-1">
            {t('settings.appearance')}: {theme === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
          </p>
        </div>
      </div>
    </div>
  );
}
