'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, MessageCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
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
}

interface WhatsAppIntegrationSettings {
  configured: boolean;
  source: 'business' | 'platform' | null;
  phoneNumberId?: string;
  businessAccountId?: string;
  hasAccessToken: boolean;
  accessTokenHint?: string;
  defaultCountryCode: string;
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
  usingPlatformDefault: boolean;
}

interface WhatsAppIntegrationForm {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  defaultCountryCode: string;
  templateConfirmation: string;
  templateReminder: string;
  templateLanguage: string;
  usePlatformDefault: boolean;
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
};

const DEFAULT_WHATSAPP_FORM: WhatsAppIntegrationForm = {
  phoneNumberId: '',
  businessAccountId: '',
  accessToken: '',
  defaultCountryCode: '374',
  templateConfirmation: 'appointment_confirmation',
  templateReminder: 'appointment_reminder',
  templateLanguage: 'en',
  usePlatformDefault: false,
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
  };
}

function whatsappFormFromApi(data: WhatsAppIntegrationSettings): WhatsAppIntegrationForm {
  return {
    phoneNumberId: data.phoneNumberId ?? '',
    businessAccountId: data.businessAccountId ?? '',
    accessToken: '',
    defaultCountryCode: data.defaultCountryCode || '374',
    templateConfirmation: data.templateConfirmation || 'appointment_confirmation',
    templateReminder: data.templateReminder || 'appointment_reminder',
    templateLanguage: data.templateLanguage || 'en',
    usePlatformDefault: false,
  };
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm py-2">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { user, setAuth, business, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [notif, setNotif] = useState<NotificationSettings | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppIntegrationForm>(DEFAULT_WHATSAPP_FORM);
  const [whatsappMeta, setWhatsappMeta] = useState<WhatsAppIntegrationSettings | null>(null);

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
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        phoneNumberId: whatsapp.phoneNumberId.trim() || undefined,
        businessAccountId: whatsapp.businessAccountId.trim() || undefined,
        defaultCountryCode: whatsapp.defaultCountryCode.trim() || undefined,
        templateConfirmation: whatsapp.templateConfirmation.trim() || undefined,
        templateReminder: whatsapp.templateReminder.trim() || undefined,
        templateLanguage: whatsapp.templateLanguage.trim() || undefined,
      };
      if (whatsapp.accessToken.trim()) {
        payload.accessToken = whatsapp.accessToken.trim();
      }
      if (whatsapp.usePlatformDefault) {
        payload.usePlatformDefault = true;
      }
      const { data: res } = await api.put(
        `/businesses/${business!.id}/notifications/whatsapp`,
        payload,
      );
      return (res.data || res) as WhatsAppIntegrationSettings;
    },
    onSuccess: (result) => {
      setWhatsappMeta(result);
      setWhatsapp(whatsappFormFromApi(result));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-integration', business?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-settings', business?.id] });
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
            <ToggleRow
              label={t('settings.whatsappUsePlatformDefault')}
              checked={whatsapp.usePlatformDefault}
              onChange={(v) => setWhatsapp({ ...whatsapp, usePlatformDefault: v })}
            />
            {!whatsapp.usePlatformDefault && (
              <>
                <FieldRow label={t('settings.whatsappPhoneNumberId')}>
                  <input
                    type="text"
                    value={whatsapp.phoneNumberId}
                    onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumberId: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappBusinessAccountId')}>
                  <input
                    type="text"
                    value={whatsapp.businessAccountId}
                    onChange={(e) => setWhatsapp({ ...whatsapp, businessAccountId: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappAccessToken')}>
                  {whatsappMeta?.hasAccessToken && whatsappMeta.accessTokenHint && (
                    <p className="text-xs text-gray-500 mb-1">
                      {t('settings.whatsappAccessTokenHint')}: {whatsappMeta.accessTokenHint}
                    </p>
                  )}
                  <input
                    type="password"
                    value={whatsapp.accessToken}
                    onChange={(e) => setWhatsapp({ ...whatsapp, accessToken: e.target.value })}
                    placeholder={t('settings.whatsappAccessTokenPlaceholder')}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappDefaultCountryCode')}>
                  <input
                    type="text"
                    value={whatsapp.defaultCountryCode}
                    onChange={(e) => setWhatsapp({ ...whatsapp, defaultCountryCode: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateConfirmation')}>
                  <input
                    type="text"
                    value={whatsapp.templateConfirmation}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateConfirmation: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateReminder')}>
                  <input
                    type="text"
                    value={whatsapp.templateReminder}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateReminder: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
                <FieldRow label={t('settings.whatsappTemplateLanguage')}>
                  <input
                    type="text"
                    value={whatsapp.templateLanguage}
                    onChange={(e) => setWhatsapp({ ...whatsapp, templateLanguage: e.target.value })}
                    className="input w-full text-sm"
                  />
                </FieldRow>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => saveWhatsApp.mutate()}
            disabled={saveWhatsApp.isPending}
            className="btn-primary mt-4 text-sm"
          >
            {saveWhatsApp.isPending ? 'Saving…' : t('settings.saveWhatsAppIntegration')}
          </button>
          {saveWhatsApp.isSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              {t('settings.whatsappIntegrationSaved')}
            </p>
          )}
        </div>

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
