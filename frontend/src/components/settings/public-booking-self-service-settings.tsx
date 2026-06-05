'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { useI18n } from '@/i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';

interface CustomerSelfServiceSettings {
  allowCancel: boolean;
  allowReschedule: boolean;
  minimumNoticeHours: number;
  maxReschedulesPerBooking: number;
  allowProviderChangeOnReschedule: boolean;
}

interface PublicBookingSettings {
  customerSelfService: CustomerSelfServiceSettings;
}

const DEFAULT_SETTINGS: PublicBookingSettings = {
  customerSelfService: {
    allowCancel: true,
    allowReschedule: true,
    minimumNoticeHours: 24,
    maxReschedulesPerBooking: 3,
    allowProviderChangeOnReschedule: false,
  },
};

function readSettings(raw: Record<string, unknown> | undefined): PublicBookingSettings {
  const publicBooking = (raw?.publicBooking as Record<string, unknown> | undefined) ?? {};
  const css = (publicBooking.customerSelfService as Record<string, unknown> | undefined) ?? {};
  return {
    customerSelfService: {
      allowCancel: css.allowCancel !== false,
      allowReschedule: css.allowReschedule !== false,
      minimumNoticeHours: Number(css.minimumNoticeHours ?? 24) || 24,
      maxReschedulesPerBooking: Number(css.maxReschedulesPerBooking ?? 3) || 3,
      allowProviderChangeOnReschedule: css.allowProviderChangeOnReschedule === true,
    },
  };
}

export function PublicBookingSelfServiceSettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PublicBookingSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  useEffect(() => {
    if (businessData?.settings) {
      queueMicrotask(() => setForm(readSettings(businessData.settings)));
    }
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const publicBooking = {
        ...((current.publicBooking as Record<string, unknown>) ?? {}),
        customerSelfService: form.customerSelfService,
      };
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, publicBooking },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {t('settings.customerSelfServiceTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.customerSelfServiceDescription')}
        </p>
      </div>

      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        checked={form.customerSelfService.allowCancel}
        onChange={(allowCancel) =>
          setForm((prev) => ({
            ...prev,
            customerSelfService: { ...prev.customerSelfService, allowCancel },
          }))
        }
        label={t('settings.allowCustomerCancel')}
      />

      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        checked={form.customerSelfService.allowReschedule}
        onChange={(allowReschedule) =>
          setForm((prev) => ({
            ...prev,
            customerSelfService: { ...prev.customerSelfService, allowReschedule },
          }))
        }
        label={t('settings.allowCustomerReschedule')}
      />

      <label className="block text-sm">
        <span className="text-gray-700 dark:text-gray-300">{t('settings.minimumNoticeHours')}</span>
        <input
          type="number"
          min={0}
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
          value={form.customerSelfService.minimumNoticeHours}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              customerSelfService: {
                ...prev.customerSelfService,
                minimumNoticeHours: Math.max(0, parseInt(e.target.value, 10) || 0),
              },
            }))
          }
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-700 dark:text-gray-300">{t('settings.maxReschedulesPerBooking')}</span>
        <input
          type="number"
          min={1}
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2"
          value={form.customerSelfService.maxReschedulesPerBooking}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              customerSelfService: {
                ...prev.customerSelfService,
                maxReschedulesPerBooking: Math.max(1, parseInt(e.target.value, 10) || 1),
              },
            }))
          }
        />
      </label>

      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        checked={form.customerSelfService.allowProviderChangeOnReschedule}
        onChange={(allowProviderChangeOnReschedule) =>
          setForm((prev) => ({
            ...prev,
            customerSelfService: {
              ...prev.customerSelfService,
              allowProviderChangeOnReschedule,
            },
          }))
        }
        label={t('settings.allowProviderChangeOnReschedule')}
      />

      <button
        type="button"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {saveMutation.isPending ? t('common.saving') : t('settings.saveSettings')}
      </button>
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">{t('settings.publicBookingSaved')}</p>
      )}
    </div>
  );
}
