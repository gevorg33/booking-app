'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, RotateCcw, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n, LOCALE_LABELS, type AppLocale } from '@/i18n';
import { readSettingsFromAuthBusiness } from '@/hooks/use-business-enabled-locales';
import {
  readBusinessDefaultLocale,
  readBusinessEnabledLocales,
} from '@/lib/business-locale';
import {
  emailTemplateDescription,
  emailTemplateLabel,
  emailTemplateVarDescription,
  emailTemplateVarLabel,
} from '@/lib/email-template-i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';

export type EmailTemplateKey =
  | 'booking_confirmation'
  | 'booking_confirmation_grouped'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'review_request'
  | 'gift_card_recipient'
  | 'gift_card_purchaser_receipt';

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  sampleValue: string;
  custom: boolean;
}

interface ResolvedEmailTemplateLocaleContent {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

interface ResolvedEmailTemplate {
  key: EmailTemplateKey;
  label: string;
  description: string;
  enabled: boolean;
  isCustomized: boolean;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: TemplateVariable[];
  byLocale?: Partial<Record<AppLocale, ResolvedEmailTemplateLocaleContent>>;
}

interface CustomVariable {
  key: string;
  label: string;
  defaultValue: string;
}

interface EmailTemplatesResponse {
  templates: ResolvedEmailTemplate[];
  customVariables: CustomVariable[];
  variables: TemplateVariable[];
}

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm';

/** Hide until custom-variable UX is clearer (footerNote, discoverability). */
const SHOW_EMAIL_CUSTOM_VARIABLES_UI = false;

export function NotificationEmailTemplatesPanel({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const localeSettings = useMemo(
    () =>
      readSettingsFromAuthBusiness(
        business as unknown as Record<string, unknown> | null | undefined,
      ),
    [business],
  );
  const enabledLocales = useMemo(
    () => readBusinessEnabledLocales(localeSettings),
    [localeSettings],
  );
  const defaultLocale = useMemo(
    () => readBusinessDefaultLocale(localeSettings),
    [localeSettings],
  );
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>('booking_confirmation');
  const [activeLocale, setActiveLocale] = useState<AppLocale>(defaultLocale);
  const [draft, setDraft] = useState<{
    enabled: boolean;
    subject: string;
    bodyText: string;
    bodyHtml: string;
  } | null>(null);
  const [customVars, setCustomVars] = useState<CustomVariable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['email-templates', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/notifications/email-templates`);
      return (res.data || res) as EmailTemplatesResponse;
    },
  });

  const selected = useMemo(
    () => data?.templates.find((tpl) => tpl.key === selectedKey),
    [data, selectedKey],
  );

  useEffect(() => {
    if (!enabledLocales.includes(activeLocale)) {
      queueMicrotask(() => setActiveLocale(enabledLocales[0] ?? defaultLocale));
    }
  }, [activeLocale, defaultLocale, enabledLocales]);

  useEffect(() => {
    if (!selected) return;
    if (!enabledLocales.includes(activeLocale)) return;
    const localeContent =
      selected.byLocale?.[activeLocale] ??
      selected.byLocale?.[defaultLocale] ?? {
        subject: selected.subject,
        bodyText: selected.bodyText,
        bodyHtml: selected.bodyHtml,
      };
    queueMicrotask(() =>
      setDraft({
        enabled: selected.enabled,
        subject: localeContent.subject,
        bodyText: localeContent.bodyText,
        bodyHtml: localeContent.bodyHtml,
      }),
    );
  }, [selected, activeLocale, defaultLocale, enabledLocales]);

  useEffect(() => {
    if (data?.customVariables) queueMicrotask(() => setCustomVars(data.customVariables));
  }, [data?.customVariables]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const { data: res } = await api.put(
        `/businesses/${businessId}/notifications/email-templates/${selectedKey}`,
        {
          enabled: draft.enabled,
          locales: {
            [activeLocale]: {
              subject: draft.subject,
              bodyText: draft.bodyText,
              bodyHtml: draft.bodyHtml,
            },
          },
        },
      );
      return res.data || res;
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['email-templates', businessId] });
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('errors.saveFailed')),
  });

  const resetTemplate = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put(
        `/businesses/${businessId}/notifications/email-templates/${selectedKey}/reset`,
      );
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', businessId] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('errors.saveFailed')),
  });

  const saveCustomVars = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put(
        `/businesses/${businessId}/notifications/email-templates/custom-variables`,
        { variables: customVars.filter((v) => v.key.trim()) },
      );
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', businessId] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('errors.saveFailed')),
  });

  function insertVariable(field: 'subject' | 'bodyText' | 'bodyHtml', key: string) {
    if (!draft) return;
    const token = `{{${key}}}`;
    setDraft({ ...draft, [field]: `${draft[field]}${token}` });
  }

  function addCustomVariable() {
    setCustomVars((prev) => [...prev, { key: '', label: '', defaultValue: '' }]);
  }

  function removeCustomVariable(index: number) {
    setCustomVars((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
      <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        {t('settings.emailTemplatesSection')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.emailTemplatesDescription')}</p>

      {isLoading && <p className="text-sm text-gray-500">{t('common.loading')}</p>}

      {data && draft && selected && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('settings.emailTemplateSelect')}</span>
              <select
                className={`${inputClass} mt-1`}
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value as EmailTemplateKey)}
              >
                {data.templates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>
                    {emailTemplateLabel(t, tpl.key, tpl.label)}
                    {tpl.isCustomized ? ' *' : ''}
                  </option>
                ))}
              </select>
            </label>
            <ToggleChoice variant="dashboard"
              className="mt-6 sm:mt-0 sm:pt-6"
              checked={draft.enabled}
              onChange={(enabled) => setDraft({ ...draft, enabled })}
              label={t('settings.emailTemplateEnabled')}
            />
          </div>

          <p className="text-xs text-gray-500">
            {emailTemplateDescription(t, selected.key, selected.description)}
          </p>

          <div className="flex flex-wrap gap-2">
            {enabledLocales.map((locale) => (
              <button
                key={locale}
                type="button"
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  activeLocale === locale
                    ? 'border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setActiveLocale(locale)}
              >
                {LOCALE_LABELS[locale]}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.emailTemplateVariables')}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.variables.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  title={emailTemplateVarDescription(t, v.key, v.description)}
                  onClick={() => insertVariable('bodyHtml', v.key)}
                  className="text-xs px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800"
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
              {SHOW_EMAIL_CUSTOM_VARIABLES_UI &&
                data.variables
                  .filter((v) => v.custom)
                  .map((v) => (
                    <button
                      key={`custom-${v.key}`}
                      type="button"
                      onClick={() => insertVariable('bodyHtml', v.key)}
                      className="text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('settings.emailTemplateSubject')}</span>
            <input
              className={`${inputClass} mt-1 font-mono`}
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('settings.emailTemplateBodyText')}</span>
            <textarea
              className={`${inputClass} mt-1 font-mono min-h-[120px]`}
              value={draft.bodyText}
              onChange={(e) => setDraft({ ...draft, bodyText: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('settings.emailTemplateBodyHtml')}</span>
            <textarea
              className={`${inputClass} mt-1 font-mono min-h-[140px]`}
              value={draft.bodyHtml}
              onChange={(e) => setDraft({ ...draft, bodyHtml: e.target.value })}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-sm" disabled={saveTemplate.isPending} onClick={() => saveTemplate.mutate()}>
              {saveTemplate.isPending ? t('common.saving') : t('settings.emailTemplateSave')}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm inline-flex items-center gap-1"
              disabled={resetTemplate.isPending}
              onClick={() => resetTemplate.mutate()}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('settings.emailTemplateReset')}
            </button>
          </div>

          {saved && <p className="text-sm text-green-600 dark:text-green-400">{t('settings.emailTemplateSaved')}</p>}

          {SHOW_EMAIL_CUSTOM_VARIABLES_UI && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('settings.emailCustomVariables')}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{t('settings.emailCustomVariablesHint')}</p>
              <div className="space-y-2">
                {customVars.map((variable, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <input
                      className={inputClass}
                      placeholder={t('settings.emailVarKey')}
                      value={variable.key}
                      onChange={(e) => {
                        const next = [...customVars];
                        next[index] = { ...variable, key: e.target.value };
                        setCustomVars(next);
                      }}
                    />
                    <input
                      className={inputClass}
                      placeholder={t('settings.emailVarLabel')}
                      value={variable.label}
                      onChange={(e) => {
                        const next = [...customVars];
                        next[index] = { ...variable, label: e.target.value };
                        setCustomVars(next);
                      }}
                    />
                    <input
                      className={inputClass}
                      placeholder={t('settings.emailVarDefault')}
                      value={variable.defaultValue}
                      onChange={(e) => {
                        const next = [...customVars];
                        next[index] = { ...variable, defaultValue: e.target.value };
                        setCustomVars(next);
                      }}
                    />
                    <button
                      type="button"
                      className="p-2 text-red-600"
                      onClick={() => removeCustomVariable(index)}
                      aria-label={t('common.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn-secondary text-sm inline-flex items-center gap-1"
                  onClick={addCustomVariable}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('settings.emailVarAdd')}
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={saveCustomVars.isPending}
                  onClick={() => saveCustomVars.mutate()}
                >
                  {t('settings.emailVarSave')}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
