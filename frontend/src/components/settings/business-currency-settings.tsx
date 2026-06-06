'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  isStripeChargeCurrencySupported,
  readBusinessCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from '@/lib/business-currency';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';

export function BusinessCurrencySettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading: businessLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  const { data: stripeConnect, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-connect', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/billing/stripe-connect`);
      const payload = (data as { data?: { connectAccountId?: string } })?.data ?? data;
      return payload as { connectAccountId?: string };
    },
  });

  const stripeConnectReady = Boolean(stripeConnect?.connectAccountId);
  const isLoading = businessLoading || stripeLoading;

  useEffect(() => {
    if (businessData?.settings) {
      queueMicrotask(() =>
        setCurrency(readBusinessCurrency(businessData.settings)),
      );
    }
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, currency, defaultCurrency: currency },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const stripeWarning =
    stripeConnectReady && !isStripeChargeCurrencySupported(currency);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.generalSection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.currencyDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="business-currency">
              {t('settings.businessCurrency')}
            </label>
            <select
              id="business-currency"
              className="input w-full max-w-xs"
              value={currency}
              disabled={saveMutation.isPending}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {SUPPORTED_BUSINESS_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('settings.currencyHint')}</p>
          </div>

          {stripeWarning && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('settings.currencyStripeWarning')}
            </p>
          )}

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.saving') : t('settings.saveCurrency')}
          </button>

          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('settings.currencySaved')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
