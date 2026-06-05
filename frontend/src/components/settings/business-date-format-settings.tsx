'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/lib/store';
import {
  BUSINESS_DATE_FORMATS,
  BUSINESS_TIME_FORMATS,
  bootstrapAuthBusinessDateFormats,
  readBusinessDateFormat,
  readBusinessTimeFormat,
  type BusinessDateFormat,
  type BusinessTimeFormat,
} from '@/lib/business-date-format';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';

export function BusinessDateFormatSettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const updateBusinessFormats = useAuthStore((state) => state.updateBusinessFormats);
  const [dateFormat, setDateFormat] = useState<BusinessDateFormat>('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<BusinessTimeFormat>('24h');
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
      setDateFormat(readBusinessDateFormat(businessData.settings));
      setTimeFormat(readBusinessTimeFormat(businessData.settings));
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, dateFormat, timeFormat },
      });
      return data;
    },
    onSuccess: () => {
      updateBusinessFormats(dateFormat, timeFormat);
      bootstrapAuthBusinessDateFormats({ dateFormat, timeFormat });
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.dateFormatSection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.dateFormatDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="label" htmlFor="business-date-format">
                {t('settings.businessDateFormat')}
              </label>
              <select
                id="business-date-format"
                className="input w-full"
                value={dateFormat}
                disabled={saveMutation.isPending}
                onChange={(e) => setDateFormat(e.target.value as BusinessDateFormat)}
              >
                {BUSINESS_DATE_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="business-time-format">
                {t('settings.businessTimeFormat')}
              </label>
              <select
                id="business-time-format"
                className="input w-full"
                value={timeFormat}
                disabled={saveMutation.isPending}
                onChange={(e) => setTimeFormat(e.target.value as BusinessTimeFormat)}
              >
                {BUSINESS_TIME_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format === '12h' ? t('settings.timeFormat12h') : t('settings.timeFormat24h')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('settings.dateFormatHint')}</p>

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.saving') : t('settings.saveDateFormat')}
          </button>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('settings.dateFormatSaved')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
