'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';
import {
  normalizeProviderTimeOffSettings,
  readProviderTimeOffSettings,
  type ProviderTimeOffSettings,
} from '@/lib/provider-time-off.util';

export function ProviderTimeOffSettings({
  businessId,
}: {
  businessId: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProviderTimeOffSettings>({ enabled: false });
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
      setForm(readProviderTimeOffSettings(businessData.settings));
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const normalized = normalizeProviderTimeOffSettings(form);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: {
          ...current,
          providerTimeOff: normalized,
        },
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-4">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {t('settings.providerTimeOffTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.providerTimeOffDescription')}
        </p>
      </div>

      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        label={t('settings.providerTimeOffEnabled')}
        checked={form.enabled}
        onChange={(enabled) => setForm({ enabled })}
      />

      <button
        type="button"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="btn-primary text-sm"
      >
        {saveMutation.isPending
          ? t('common.saving')
          : t('settings.providerTimeOffSave')}
      </button>
      {saved ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('settings.providerTimeOffSaved')}
        </p>
      ) : null}
    </div>
  );
}
