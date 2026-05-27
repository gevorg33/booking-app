'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { formatDateDisplay } from '@/lib/date-format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

interface SubscriptionInfo {
  status: string;
  planId: string | null;
  plan: Plan | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-600/15 text-green-400' },
  trialing: { label: 'Trial', className: 'bg-blue-600/15 text-blue-400' },
  past_due: { label: 'Past due', className: 'bg-red-600/15 text-red-400' },
  canceled: { label: 'Canceled', className: 'bg-gray-600/15 text-gray-400' },
  inactive: { label: 'Not subscribed', className: 'bg-yellow-600/15 text-yellow-400' },
};

export default function BillingPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<'success' | 'canceled' | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) setBanner('success');
    if (params.get('canceled')) setBanner('canceled');

    const sessionId = params.get('session_id');
    if (params.get('success') && sessionId && business?.id) {
      setConfirming(true);
      api
        .post(`/businesses/${business.id}/billing/confirm-checkout`, { sessionId })
        .then(() => queryClient.invalidateQueries({ queryKey: ['billing-subscription'] }))
        .catch(() => {})
        .finally(() => {
          setConfirming(false);
          window.history.replaceState({}, '', '/dashboard/billing');
        });
    }
  }, [business?.id, queryClient]);

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data } = await api.get('/billing/plans');
      return data.data || data;
    },
  });

  const { data: subscription, isLoading: subLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['billing-subscription', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/billing/subscription`);
      return data.data || data;
    },
    enabled: !!business?.id,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/checkout`, {
        planId,
      });
      const url = data.data?.url || data.url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/portal`);
      const url = data.data?.url || data.url;
      if (!url) throw new Error('No portal URL returned');
      window.location.href = url;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
  };

  const statusInfo = STATUS_LABEL[subscription?.status ?? 'inactive'] ?? STATUS_LABEL.inactive;
  const loading = plansLoading || subLoading || confirming;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-400" />
          {t('billing.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your OptiSchedule plan. Powered by Stripe.
        </p>
      </div>

      {banner === 'success' && (
        <div className="mb-6 p-4 rounded-lg border border-green-500/30 bg-green-600/10 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-green-300 font-medium">Payment successful</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Your subscription is being activated. If status doesn&apos;t update, click Refresh below.
            </p>
            <button onClick={refresh} className="text-sm text-green-400 underline mt-2">
              Refresh status
            </button>
          </div>
        </div>
      )}

      {banner === 'canceled' && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-600/10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-yellow-200 text-sm">Checkout was canceled. You can subscribe anytime below.</p>
        </div>
      )}

      {/* Current subscription */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Current plan</h2>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-medium">
                  {subscription?.plan?.name ?? 'No plan'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
              {subscription?.currentPeriodEnd && subscription.isActive && (
                <p className="text-sm text-gray-400">
                  Renews{' '}
                  {formatDateDisplay(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>
            {subscription?.isActive && (
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {portalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage subscription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plans */}
      <h2 className="font-semibold mb-4">Available plans</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id && subscription?.isActive;
          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col ${
                plan.popular ? 'border-blue-500/40 ring-1 ring-blue-500/20' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1 mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                <span className="text-gray-400 text-sm"> / month</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="btn-secondary w-full opacity-60 cursor-default">
                  Current plan
                </button>
              ) : (
                <button
                  onClick={() => checkoutMutation.mutate(plan.id)}
                  disabled={checkoutMutation.isPending}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Subscribe</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {checkoutMutation.isError && (
        <p className="mt-4 text-sm text-red-400">
          {(checkoutMutation.error as any)?.response?.data?.message ||
            'Failed to start checkout'}
        </p>
      )}

      <p className="text-xs text-gray-500 mt-8">
        Test mode — use Stripe test card 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </div>
  );
}
