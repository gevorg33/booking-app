'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  DATA_RESIDENCY_REGIONS,
  DEFAULT_BUSINESS_PRIVACY_SETTINGS,
  RETENTION_FIELDS,
  readBusinessPrivacySettings,
  type DataResidencyRegion,
  type RetentionField,
} from '@/lib/business-compliance';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';

export function BusinessPrivacySettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [privacy, setPrivacy] = useState(DEFAULT_BUSINESS_PRIVACY_SETTINGS);
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  useEffect(() => {
    if (!businessData?.settings) return;
    queueMicrotask(() => {
      setPrivacy(readBusinessPrivacySettings(businessData.settings));
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, privacy },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const setRetention = (field: RetentionField, value: string) => {
    const parsed = Number(value);
    setPrivacy((prev) => ({
      ...prev,
      retention: {
        ...prev.retention,
        [field]: Number.isFinite(parsed) ? parsed : prev.retention[field],
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.privacySection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.privacyDescription')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {RETENTION_FIELDS.map((field) => (
          <div key={field}>
            <label className="label" htmlFor={`retention-${field}`}>
              {t(`settings.retention.${field}`)}
            </label>
            <input
              id={`retention-${field}`}
              type="number"
              className="input w-full"
              value={privacy.retention[field]}
              onChange={(e) => setRetention(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="privacy-policy-version">
          {t('settings.privacyPolicyVersion')}
        </label>
        <input
          id="privacy-policy-version"
          className="input w-full max-w-xs"
          value={privacy.privacyPolicyVersion}
          onChange={(e) =>
            setPrivacy((p) => ({ ...p, privacyPolicyVersion: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label" htmlFor="data-residency">
          {t('settings.dataResidency.label')}
        </label>
        <select
          id="data-residency"
          className="input w-full max-w-xs"
          value={privacy.dataResidencyRegion}
          onChange={(e) =>
            setPrivacy((p) => ({
              ...p,
              dataResidencyRegion: e.target.value as DataResidencyRegion,
            }))
          }
        >
          {DATA_RESIDENCY_REGIONS.map((region) => (
            <option key={region} value={region}>
              {t(`settings.dataResidency.${region}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
        <ToggleChoice
          variant="dashboard"
          layout="toggle-first"
          checked={privacy.cookieBanner.enabled}
          disabled={saveMutation.isPending}
          onChange={(enabled) =>
            setPrivacy((p) => ({
              ...p,
              cookieBanner: { ...p.cookieBanner, enabled },
            }))
          }
          label={t('settings.cookieBannerEnabled')}
        />
      </div>

      {privacy.cookieBanner.enabled && (
        <div>
          <label className="label" htmlFor="cookie-banner-message">
            {t('settings.cookieBannerMessage')}
          </label>
          <textarea
            id="cookie-banner-message"
            className="input w-full min-h-[80px]"
            value={privacy.cookieBanner.message}
            onChange={(e) =>
              setPrivacy((p) => ({
                ...p,
                cookieBanner: { ...p.cookieBanner, message: e.target.value },
              }))
            }
            placeholder={t('settings.cookieBannerMessagePlaceholder')}
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('settings.granularConsentTitle')}
        </p>
        <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
          <ToggleChoice
            variant="dashboard"
            layout="toggle-first"
            checked={privacy.granularConsent.requireAiProcessing}
            disabled={saveMutation.isPending}
            onChange={(requireAiProcessing) =>
              setPrivacy((p) => ({
                ...p,
                granularConsent: {
                  ...p.granularConsent,
                  requireAiProcessing,
                },
              }))
            }
            label={t('settings.requireAiProcessingConsent')}
          />
          <ToggleChoice
            variant="dashboard"
            layout="toggle-first"
            checked={privacy.granularConsent.requireThirdPartyIntegrations}
            disabled={saveMutation.isPending}
            onChange={(requireThirdPartyIntegrations) =>
              setPrivacy((p) => ({
                ...p,
                granularConsent: {
                  ...p.granularConsent,
                  requireThirdPartyIntegrations,
                },
              }))
            }
            label={t('settings.requireThirdPartyConsent')}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn-primary text-sm"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? t('common.saving') : t('settings.savePrivacy')}
      </button>
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('settings.privacySaved')}
        </p>
      )}
    </div>
  );
}
