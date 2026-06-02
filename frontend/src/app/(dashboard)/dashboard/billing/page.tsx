'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Wallet,
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

interface StripeConnectInfo {
  configured: boolean;
  connectAccountId?: string;
  connectCountry?: string;
  connectMode?: 'oauth' | 'express' | 'manual';
  accountType?: string;
  oauthAvailable?: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  displayName?: string;
}

const EXPRESS_COUNTRIES = ['AE', 'AM', 'DE', 'GB', 'US', 'FR', 'AU', 'CA'] as const;

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
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectNotice, setConnectNotice] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectAccountId, setConnectAccountId] = useState('');
  const [expressCountry, setExpressCountry] = useState('AM');
  const connectCallbackHandled = useRef(false);
  const oauthCallbackHandled = useRef(false);

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

  const { data: stripeConnect, isLoading: connectLoading } = useQuery<StripeConnectInfo>({
    queryKey: ['stripe-connect', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/billing/stripe-connect`);
      return data.data || data;
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (stripeConnect?.connectAccountId) {
      setConnectAccountId(stripeConnect.connectAccountId);
    }
  }, [stripeConnect?.connectAccountId]);

  useEffect(() => {
    if (stripeConnect?.connectCountry) {
      setExpressCountry(stripeConnect.connectCountry);
    }
  }, [stripeConnect?.connectCountry]);

  const oauthCompleteMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/stripe-connect/oauth`, {
        code,
      });
      return data.data || data;
    },
    onSuccess: () => {
      setConnectError(null);
      setConnectNotice(t('billing.stripeConnectSaved'));
      queryClient.invalidateQueries({ queryKey: ['stripe-connect', business?.id] });
    },
    onError: (err: unknown) => {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const handleConnectCallback = async (mode: 'return' | 'refresh') => {
    if (!business?.id || connectCallbackHandled.current) return;
    connectCallbackHandled.current = true;
    window.history.replaceState({}, '', '/dashboard/billing');

    if (mode === 'refresh') {
      expressConnectMutation.mutate();
      return;
    }

    setConnectNotice(null);
    setConnectError(null);
    try {
      await api.post(`/businesses/${business.id}/billing/stripe-connect/sync`);
      await queryClient.invalidateQueries({ queryKey: ['stripe-connect', business.id] });
      setConnectNotice(t('billing.stripeConnectSynced'));
    } catch (err: unknown) {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectParam = params.get('stripe_connect');
    if (!connectParam || !business?.id) return;

    if (connectParam === 'oauth') {
      if (oauthCallbackHandled.current) return;
      window.history.replaceState({}, '', '/dashboard/billing');
      const error = params.get('error_description') || params.get('error');
      if (error) {
        oauthCallbackHandled.current = true;
        setConnectError(error);
        return;
      }
      const code = params.get('code');
      if (code) {
        oauthCallbackHandled.current = true;
        oauthCompleteMutation.mutate(code);
      }
      return;
    }

    if (connectParam === 'return') {
      void handleConnectCallback('return');
    } else if (connectParam === 'refresh') {
      void handleConnectCallback('refresh');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  const oauthConnectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/stripe-connect/onboard`, {
        mode: 'oauth',
      });
      const url = data.data?.url || data.url;
      if (!url) throw new Error('No OAuth URL returned');
      window.location.href = url;
    },
    onError: (err: unknown) => {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const expressConnectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/stripe-connect/onboard`, {
        mode: 'express',
        country: expressCountry,
      });
      const url = data.data?.url || data.url;
      if (!url) throw new Error('No onboarding URL returned');
      window.location.href = url;
    },
    onError: (err: unknown) => {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const syncConnectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/stripe-connect/sync`);
      return data.data || data;
    },
    onSuccess: () => {
      setConnectError(null);
      setConnectNotice(t('billing.stripeConnectSynced'));
      queryClient.invalidateQueries({ queryKey: ['stripe-connect', business?.id] });
    },
    onError: (err: unknown) => {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
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

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/billing/stripe-connect/login`);
      const url = data.data?.url || data.url;
      if (!url) throw new Error('No dashboard URL returned');
      window.location.href = url;
    },
    onError: (err: unknown) => {
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const saveConnectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${business!.id}/billing/stripe-connect`, {
        connectAccountId: connectAccountId.trim(),
      });
      return data.data || data;
    },
    onSuccess: () => {
      setConnectError(null);
      setConnectNotice(t('billing.stripeConnectSaved'));
      queryClient.invalidateQueries({ queryKey: ['stripe-connect', business?.id] });
    },
    onError: (err: unknown) => {
      setConnectNotice(null);
      setConnectError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const disconnectConnectMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/businesses/${business!.id}/billing/stripe-connect`, { disconnect: true });
    },
    onSuccess: () => {
      setConnectAccountId('');
      setConnectError(null);
      setConnectNotice(null);
      queryClient.invalidateQueries({ queryKey: ['stripe-connect', business?.id] });
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
  };

  const statusInfo = STATUS_LABEL[subscription?.status ?? 'inactive'] ?? STATUS_LABEL.inactive;
  const loading = plansLoading || subLoading || confirming || connectLoading;
  const connectBusy =
    oauthConnectMutation.isPending ||
    expressConnectMutation.isPending ||
    oauthCompleteMutation.isPending ||
    loginMutation.isPending ||
    saveConnectMutation.isPending ||
    syncConnectMutation.isPending ||
    disconnectConnectMutation.isPending;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-400" />
          {t('billing.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('billing.subtitle')}</p>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-violet-400" />
          {t('billing.clientPayments')}
        </h2>
        <p className="text-sm text-gray-400 mb-4">{t('billing.clientPaymentsDescription')}</p>
        <p className="text-xs mb-4">
          {stripeConnect?.configured && stripeConnect.chargesEnabled ? (
            <span className="text-green-400">{t('billing.stripeConnectConfigured')}</span>
          ) : stripeConnect?.connectAccountId ? (
            <span className="text-amber-400">{t('billing.stripeConnectPending')}</span>
          ) : (
            <span className="text-gray-500">{t('billing.stripeConnectNotConfigured')}</span>
          )}
          {stripeConnect?.displayName && (
            <span className="text-gray-400 ml-2">
              · {t('billing.stripeDisplayName')}: {stripeConnect.displayName}
            </span>
          )}
          {stripeConnect?.connectCountry && (
            <span className="text-gray-400 ml-2">· {stripeConnect.connectCountry}</span>
          )}
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {connectLoading ? (
            <div className="h-9 w-40 rounded-lg bg-white/5 animate-pulse" />
          ) : !stripeConnect?.chargesEnabled ? (
            <>
              {stripeConnect?.oauthAvailable ? (                <button
                  type="button"
                  onClick={() => oauthConnectMutation.mutate()}
                  disabled={connectBusy}
                  className="btn-primary flex items-center gap-2"
                >
                  {oauthConnectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {stripeConnect?.connectAccountId
                    ? t('billing.stripeConnectContinueOAuth')
                    : t('billing.stripeConnectOAuth')}
                </button>
              ) : (
                !stripeConnect?.connectAccountId && (
                  <button
                    type="button"
                    onClick={() => expressConnectMutation.mutate()}
                    disabled={connectBusy}
                    className="btn-primary flex items-center gap-2"
                  >
                    {expressConnectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    {t('billing.stripeConnectStart')}
                  </button>
                )
              )}
              {stripeConnect?.connectAccountId && stripeConnect.connectMode === 'express' && (
                <button
                  type="button"
                  onClick={() => expressConnectMutation.mutate()}
                  disabled={connectBusy}
                  className="btn-secondary flex items-center gap-2"
                >
                  {expressConnectMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {t('billing.stripeConnectContinue')}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => loginMutation.mutate()}
              disabled={connectBusy}
              className="btn-secondary flex items-center gap-2"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {t('billing.stripeConnectManage')}
            </button>
          )}

          {stripeConnect?.connectAccountId && !stripeConnect.chargesEnabled && (
            <button
              type="button"
              onClick={() => syncConnectMutation.mutate()}
              disabled={connectBusy}
              className="btn-secondary"
            >
              {syncConnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('billing.stripeConnectRefresh')
              )}
            </button>
          )}

          {stripeConnect?.connectAccountId && (
            <button
              type="button"
              onClick={() => disconnectConnectMutation.mutate()}
              disabled={connectBusy}
              className="btn-secondary"
            >
              {t('billing.stripeConnectDisconnect')}
            </button>
          )}
        </div>

        {connectError && <p className="text-sm text-red-400 mb-2">{connectError}</p>}
        {connectNotice && <p className="text-sm text-green-400 mb-2">{connectNotice}</p>}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-gray-500 underline"
        >
          {showAdvanced ? t('billing.stripeConnectHideAdvanced') : t('billing.stripeConnectShowAdvanced')}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 max-w-xl">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                {t('billing.stripeConnectExpressCountry')}
              </label>
              <select
                className="input w-full max-w-xs"
                value={expressCountry}
                onChange={(e) => setExpressCountry(e.target.value)}
              >
                {EXPRESS_COUNTRIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{t('billing.stripeConnectExpressHint')}</p>
              <button
                type="button"
                onClick={() => expressConnectMutation.mutate()}
                disabled={connectBusy}
                className="btn-secondary mt-2 flex items-center gap-2"
              >
                {expressConnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {t('billing.stripeConnectExpress')}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="input flex-1 font-mono text-sm"
              placeholder={t('billing.stripeConnectPlaceholder')}
              value={connectAccountId}
              onChange={(e) => setConnectAccountId(e.target.value)}
            />
            <button
              type="button"
              onClick={() => saveConnectMutation.mutate()}
              disabled={connectBusy}
              className="btn-secondary shrink-0"
            >
              {saveConnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('billing.stripeConnectSaveManual')
              )}
            </button>
            </div>
          </div>
        )}
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
