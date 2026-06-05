'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';

interface PayAtVenueForm {
  acceptCashPayments: boolean;
}

function readForm(settings: Record<string, unknown> | undefined): PayAtVenueForm {
  const publicBooking = (settings?.publicBooking as Record<string, unknown> | undefined) ?? {};
  return {
    acceptCashPayments: publicBooking.acceptCashPayments === true,
  };
}

export function PayAtVenueSettings({
  businessId,
  embeddedInBilling = false,
}: {
  businessId: string;
  /** When true, Stripe CTA points upward on Billing instead of linking here. */
  embeddedInBilling?: boolean;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PayAtVenueForm>({ acceptCashPayments: false });
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
      queueMicrotask(() => setForm(readForm(businessData.settings)));
    }
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const publicBooking = {
        ...((current.publicBooking as Record<string, unknown>) ?? {}),
        acceptCashPayments: form.acceptCashPayments,
      };
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: { ...current, publicBooking },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
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

  if (!stripeConnectReady) {
    return (
      <div
        className={
          embeddedInBilling
            ? 'card mb-8 space-y-3'
            : 'rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3'
        }
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {t('settings.payAtVenueTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {embeddedInBilling
            ? t('billing.payAtVenueConnectStripeFirst')
            : t('settings.payAtVenueRequiresStripeDescription')}
        </p>
        {!embeddedInBilling && (
          <Link href="/dashboard/billing" className="btn-primary text-sm inline-flex">
            {t('settings.payAtVenueGoToBilling')}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        embeddedInBilling
          ? 'card mb-8 space-y-5'
          : 'rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5'
      }
    >
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {t('settings.payAtVenueTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.payAtVenueDescription')}
        </p>
      </div>

      <ToggleChoice
        variant="dashboard"
        checked={form.acceptCashPayments}
        onChange={(acceptCashPayments) => setForm((prev) => ({ ...prev, acceptCashPayments }))}
        label={t('settings.acceptCashPayments')}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
        {t('settings.acceptCashPaymentsHint')}
      </p>

      <button
        type="button"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {saveMutation.isPending ? t('common.saving') : t('settings.saveSettings')}
      </button>
      {saved && (
        <p className="text-sm text-green-600 dark:text-green-400">{t('settings.payAtVenueSaved')}</p>
      )}
    </div>
  );
}
