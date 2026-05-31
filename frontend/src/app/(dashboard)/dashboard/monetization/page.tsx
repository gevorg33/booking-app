'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { CustomerSelect } from '@/components/customers/customer-select';
import {
  filterActiveSubscriptionPlans,
  formatSubscriptionPlanAssignLabel,
  serviceIdsWithSubscriptionPlans,
  subscriptionPlansForService,
} from '@/lib/subscription-plans';
import { calculateSubscriptionPricing } from '@/lib/subscription-pricing';
import { dateKeyToExpiresAtEndOfDay, formatDateDisplay, isExpiredAt } from '@/lib/date-format';

type Tab = 'gift-cards' | 'memberships' | 'loyalty' | 'promo-codes';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export default function MonetizationPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [tab, setTab] = useState<Tab>('gift-cards');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'gift-cards', label: t('monetization.giftCards') },
    { id: 'memberships', label: t('monetization.memberships') },
    { id: 'loyalty', label: t('monetization.loyalty') },
    { id: 'promo-codes', label: t('monetization.promoCodes') },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-400" />
          {t('monetization.title')}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t('monetization.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'gift-cards' && business?.id && <GiftCardsTab businessId={business.id} />}
      {tab === 'memberships' && business?.id && <MembershipsTab businessId={business.id} />}
      {tab === 'loyalty' && business?.id && <LoyaltyTab businessId={business.id} />}
      {tab === 'promo-codes' && business?.id && <PromoCodesTab businessId={business.id} />}
    </div>
  );
}

function GiftCardsTab({ businessId }: { businessId: string }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [expiresAtDay, setExpiresAtDay] = useState('');

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['gift-cards', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = expiresAtDay ? dateKeyToExpiresAtEndOfDay(expiresAtDay) : undefined;
      const { data } = await api.post(`/businesses/${businessId}/gift-cards`, {
        amount: parseFloat(amount),
        currency,
        ...(expiresAt ? { expiresAt } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      setAmount('50');
      setExpiresAtDay('');
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="card flex flex-wrap gap-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            min="1"
            step="0.01"
            className="input max-w-[140px]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Currency</label>
          <input
            className="input max-w-[100px]"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="label">{t('monetization.expirationDate')}</label>
          <input
            type="date"
            className="input max-w-[160px]"
            value={expiresAtDay}
            onChange={(e) => setExpiresAtDay(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">{t('monetization.expirationOptional')}</p>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create gift card
        </button>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : cards.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No gift cards yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Code</th>
                <th className="px-4 py-3 font-medium text-gray-400">Balance</th>
                <th className="px-4 py-3 font-medium text-gray-400">Initial</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-mono">{card.code}</td>
                  <td className="px-4 py-3">
                    {Number(card.balance).toFixed(2)} {card.currency}
                  </td>
                  <td className="px-4 py-3">
                    {Number(card.initialBalance).toFixed(2)} {card.currency}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {card.expiresAt
                      ? formatDateDisplay(card.expiresAt, locale)
                      : t('monetization.noExpiration')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        !card.isActive
                          ? 'bg-gray-600/10 text-gray-400'
                          : isExpiredAt(card.expiresAt)
                            ? 'bg-amber-600/10 text-amber-400'
                            : 'bg-green-600/10 text-green-400'
                      }`}
                    >
                      {!card.isActive
                        ? 'Inactive'
                        : isExpiredAt(card.expiresAt)
                          ? t('monetization.expired')
                          : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MembershipsTab({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    serviceId: '',
    durationMonths: '3',
    customDurationMonths: '',
    includedAppointments: '6',
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: '5',
  });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignServiceId, setAssignServiceId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [selectedServicePrice, setSelectedServicePrice] = useState(25);

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<Array<{ id: string; name: string; price: number }>>(data);
    },
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans', businessId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/subscriptions/plans?includeInactive=true`,
      );
      return unwrap<any[]>(data);
    },
  });

  const activePlans = filterActiveSubscriptionPlans(plans);

  const assignableServices = useMemo(() => {
    const serviceIds = new Set(serviceIdsWithSubscriptionPlans(activePlans));
    return services.filter((service) => serviceIds.has(service.id));
  }, [activePlans, services]);

  const plansForAssignService = useMemo(
    () => subscriptionPlansForService(activePlans, assignServiceId),
    [activePlans, assignServiceId],
  );

  const resolvedDurationMonths =
    form.durationMonths === 'custom'
      ? parseInt(form.customDurationMonths, 10)
      : parseInt(form.durationMonths, 10);

  const preview = calculateSubscriptionPricing(
    selectedServicePrice,
    parseInt(form.includedAppointments, 10) || 0,
    form.discountType,
    parseFloat(form.discountValue) || 0,
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        serviceId: form.serviceId,
        durationMonths: resolvedDurationMonths,
        includedAppointments: parseInt(form.includedAppointments, 10),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
      };
      if (editingPlanId) {
        const { data } = await api.put(
          `/businesses/${businessId}/subscriptions/plans/${editingPlanId}`,
          payload,
        );
        return data;
      }
      const { data } = await api.post(`/businesses/${businessId}/subscriptions/plans`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', businessId] });
      setEditingPlanId(null);
      setForm({
        name: '',
        serviceId: '',
        durationMonths: '3',
        customDurationMonths: '',
        includedAppointments: '6',
        discountType: 'percent',
        discountValue: '5',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.patch(
        `/businesses/${businessId}/subscriptions/plans/${planId}/deactivate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', businessId] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.patch(
        `/businesses/${businessId}/subscriptions/plans/${planId}/activate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', businessId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      await api.delete(`/businesses/${businessId}/subscriptions/plans/${planId}`);
    },
    onSuccess: (_data, planId) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans', businessId] });
      if (editingPlanId === planId) {
        setEditingPlanId(null);
        setForm({
          name: '',
          serviceId: '',
          durationMonths: '3',
          customDurationMonths: '',
          includedAppointments: '6',
          discountType: 'percent',
          discountValue: '5',
        });
      }
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/subscriptions/assign`, {
        customerId: assignCustomerId,
        planId: assignPlanId,
      });
      return data;
    },
    onSuccess: () => {
      setAssignCustomerId('');
      setAssignServiceId('');
      setAssignPlanId('');
    },
  });

  const startEditingPlan = (plan: (typeof plans)[number]) => {
    setEditingPlanId(plan.id);
    const preset = ['3', '6', '12'].includes(String(plan.durationMonths))
      ? String(plan.durationMonths)
      : 'custom';
    setForm({
      name: plan.name,
      serviceId: plan.serviceId,
      durationMonths: preset,
      customDurationMonths: preset === 'custom' ? String(plan.durationMonths) : '',
      includedAppointments: String(plan.includedAppointments),
      discountType: plan.discountType,
      discountValue: String(plan.discountValue),
    });
    setSelectedServicePrice(Number(plan.service?.price ?? 0));
  };

  return (
    <div className="space-y-6">
      <form
        className="card grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">Plan name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Service</label>
          <select
            className="input"
            value={form.serviceId}
            onChange={(e) => {
              const svc = services.find((s) => s.id === e.target.value);
              setSelectedServicePrice(Number(svc?.price ?? 0));
              setForm({ ...form, serviceId: e.target.value });
            }}
            required
          >
            <option value="">Select service…</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Duration (months)</label>
          <select
            className="input"
            value={form.durationMonths}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {form.durationMonths === 'custom' && (
          <div>
            <label className="label">Custom months</label>
            <input
              type="number"
              min="1"
              className="input"
              value={form.customDurationMonths}
              onChange={(e) => setForm({ ...form, customDurationMonths: e.target.value })}
              required
            />
          </div>
        )}
        <div>
          <label className="label">Included appointments</label>
          <input
            type="number"
            min="1"
            className="input"
            value={form.includedAppointments}
            onChange={(e) => setForm({ ...form, includedAppointments: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Discount type</label>
          <select
            className="input"
            value={form.discountType}
            onChange={(e) =>
              setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })
            }
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </div>
        <div>
          <label className="label">Discount value</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
          />
        </div>
        {form.serviceId && (
          <div className="md:col-span-2 rounded-lg bg-gray-800/50 p-4 text-sm space-y-1">
            <p>
              Regular total: <strong>${preview.regularTotal.toFixed(2)}</strong>
            </p>
            <p>
              Subscription price: <strong>${preview.subscriptionPrice.toFixed(2)}</strong>
            </p>
            <p className="text-emerald-400">
              Customer saves: ${preview.savings.toFixed(2)}
            </p>
          </div>
        )}
        <div className="md:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingPlanId ? 'Update subscription plan' : 'Create subscription plan'}
          </button>
          {editingPlanId && (
            <button
              type="button"
              className="btn-secondary text-sm ml-2"
              onClick={() => {
                setEditingPlanId(null);
                setForm({
                  name: '',
                  serviceId: '',
                  durationMonths: '3',
                  customDurationMonths: '',
                  includedAppointments: '6',
                  discountType: 'percent',
                  discountValue: '5',
                });
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No subscription plans yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-400">Service</th>
                <th className="px-4 py-3 font-medium text-gray-400">Duration</th>
                <th className="px-4 py-3 font-medium text-gray-400">Appointments</th>
                <th className="px-4 py-3 font-medium text-gray-400">Price</th>
                <th className="px-4 py-3 font-medium text-gray-400">Savings</th>
                <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">{plan.service?.name ?? '—'}</td>
                  <td className="px-4 py-3">{plan.durationMonths} mo</td>
                  <td className="px-4 py-3">{plan.includedAppointments}</td>
                  <td className="px-4 py-3">
                    ${Number(plan.preview?.pricing?.subscriptionPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">
                    ${Number(plan.preview?.pricing?.savings ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {plan.isActive !== false
                      ? t('monetization.subscriptionPlanStatusActive')
                      : t('monetization.subscriptionPlanStatusDeactivated')}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      className="text-xs text-blue-400"
                      onClick={() => startEditingPlan(plan)}
                    >
                      Edit
                    </button>
                    {plan.isActive !== false ? (
                      <button
                        type="button"
                        className="text-xs text-red-400"
                        onClick={() => {
                          if (!window.confirm(t('monetization.subscriptionPlanDeactivateConfirm'))) return;
                          deactivateMutation.mutate(plan.id);
                        }}
                      >
                        {t('monetization.subscriptionPlanDeactivate')}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="text-xs text-emerald-400"
                          disabled={activateMutation.isPending}
                          onClick={() => {
                            if (!window.confirm(t('monetization.subscriptionPlanActivateConfirm'))) return;
                            activateMutation.mutate(plan.id);
                          }}
                        >
                          {t('monetization.subscriptionPlanActivate')}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (!window.confirm(t('monetization.subscriptionPlanDeleteConfirm'))) return;
                            deleteMutation.mutate(plan.id);
                          }}
                        >
                          {t('monetization.subscriptionPlanDelete')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activePlans.length > 0 && (
        <form
          className="card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            assignMutation.mutate();
          }}
        >
          <h3 className="font-semibold">Assign subscription to customer</h3>
          <CustomerSelect businessId={businessId} value={assignCustomerId} onChange={setAssignCustomerId} required />
          <div>
            <label className="label">Service</label>
            <select
              className="input max-w-md"
              value={assignServiceId}
              onChange={(e) => {
                setAssignServiceId(e.target.value);
                setAssignPlanId('');
              }}
              required
            >
              <option value="">Select service…</option>
              {assignableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Plan</label>
            <select
              className="input max-w-md"
              value={assignPlanId}
              onChange={(e) => setAssignPlanId(e.target.value)}
              required
              disabled={!assignServiceId}
            >
              <option value="">
                {assignServiceId
                  ? plansForAssignService.length > 0
                    ? 'Select plan…'
                    : 'No plans for this service'
                  : 'Select a service first…'}
              </option>
              {plansForAssignService.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {formatSubscriptionPlanAssignLabel(plan)}
                </option>
              ))}
            </select>
            {assignServiceId && plansForAssignService.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                This service has {plansForAssignService.length} subscription plans — pick the one to assign.
              </p>
            )}
          </div>
          <button type="submit" disabled={assignMutation.isPending} className="btn-primary">
            Assign subscription
          </button>
        </form>
      )}
    </div>
  );
}

function LoyaltyTab({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('1');
  const [note, setNote] = useState('');
  const [earnPercent, setEarnPercent] = useState('5');
  const [excludedServiceIds, setExcludedServiceIds] = useState<string[]>([]);

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<Array<{ id: string; name: string; isActive?: boolean }>>(data);
    },
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['loyalty-settings', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/loyalty/settings`);
      return unwrap<{
        earnPercentCashback: number;
        earnExcludedServiceIds: string[];
        bonusDollarValue: number;
      }>(res);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.patch(`/businesses/${businessId}/loyalty/settings`, {
        earnPercentCashback: parseFloat(earnPercent),
        earnExcludedServiceIds: excludedServiceIds,
      });
      return unwrap<{ earnPercentCashback: number; earnExcludedServiceIds: string[] }>(res);
    },
    onSuccess: (data) => {
      setEarnPercent(String(data.earnPercentCashback));
      setExcludedServiceIds(data.earnExcludedServiceIds ?? []);
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings', businessId] });
    },
  });

  useEffect(() => {
    if (settings?.earnPercentCashback != null) {
      setEarnPercent(String(settings.earnPercentCashback));
    }
    if (settings?.earnExcludedServiceIds) {
      setExcludedServiceIds(settings.earnExcludedServiceIds);
    }
  }, [settings?.earnPercentCashback, settings?.earnExcludedServiceIds]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['loyalty', businessId, customerId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/loyalty/customer/${customerId}`,
      );
      return unwrap<{ account: { pointsBalance: number; lifetimeEarned: number }; transactions: any[] }>(res);
    },
    enabled: !!customerId,
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/loyalty/customer/${customerId}/adjust`,
        { points: parseFloat(adjustPoints), note: note || undefined },
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', businessId, customerId] });
      setNote('');
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          settingsMutation.mutate();
        }}
      >
        <div>
          <h3 className="font-semibold text-gray-100">{t('monetization.loyaltyEarnRate')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('monetization.loyaltyEarnRateHint')}</p>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">{t('monetization.loyaltyEarnPercent')}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="input max-w-[120px]"
              value={settings ? earnPercent : ''}
              onChange={(e) => setEarnPercent(e.target.value)}
              disabled={settingsLoading || !settings}
              required
            />
          </div>
          <button
            type="submit"
            disabled={settingsMutation.isPending || settingsLoading || !settings}
            className="btn-primary"
          >
            {settingsMutation.isPending ? t('monetization.saving') : t('monetization.saveSettings')}
          </button>
        </div>
        {settings && (
          <p className="text-xs text-gray-500">
            Example: $10.00 paid at {settings.earnPercentCashback}% → $
            {(10 * settings.earnPercentCashback / 100).toFixed(2)} bonus credit
          </p>
        )}
        <div>
          <label className="label">{t('monetization.loyaltyExcludedServices')}</label>
          <p className="text-sm text-gray-500 mb-2">{t('monetization.loyaltyExcludedServicesHint')}</p>
          {services.length === 0 ? (
            <p className="text-sm text-gray-500">{t('monetization.loyaltyNoServices')}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-800 p-3">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    className="rounded border-gray-600"
                    checked={excludedServiceIds.includes(service.id)}
                    onChange={(e) => {
                      setExcludedServiceIds((prev) =>
                        e.target.checked
                          ? [...prev, service.id]
                          : prev.filter((id) => id !== service.id),
                      );
                    }}
                    disabled={settingsLoading || !settings}
                  />
                  <span>
                    {service.name}
                    {service.isActive === false && (
                      <span className="ml-2 text-xs text-gray-500">(Inactive)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </form>

      <div className="card space-y-4">
        <label className="label">Customer</label>
        <CustomerSelect businessId={businessId} value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId ? (
        <p className="text-gray-500 text-sm">Select a customer to view loyalty balance.</p>
      ) : isLoading || isFetching ? (
        <div className="card flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="card text-center">
              <p className="text-2xl font-bold text-emerald-400">${data.account.pointsBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{t('monetization.bonusBalance')}</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold">${data.account.lifetimeEarned.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{t('monetization.lifetimeEarned')}</p>
            </div>
          </div>

          <form
            className="card flex flex-wrap gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              adjustMutation.mutate();
            }}
          >
            <div>
              <label className="label">{t('monetization.adjustBonus')}</label>
              <input
                type="number"
                step="0.01"
                className="input max-w-[140px]"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Note</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="submit" disabled={adjustMutation.isPending} className="btn-primary">
              Adjust points
            </button>
          </form>

          {data.transactions.length > 0 && (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Points</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800/80">
                      <td className="px-4 py-3 capitalize">{tx.type}</td>
                      <td className="px-4 py-3">{tx.points > 0 ? `+${tx.points}` : tx.points}</td>
                      <td className="px-4 py-3 text-gray-400">{tx.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function PromoCodesTab({ businessId }: { businessId: string }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAtDay, setExpiresAtDay] = useState('');

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promo-codes', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/promo-codes`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = expiresAtDay ? dateKeyToExpiresAtEndOfDay(expiresAtDay) : undefined;
      const { data } = await api.post(`/businesses/${businessId}/promo-codes`, {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        description: description || undefined,
        ...(expiresAt ? { expiresAt } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', businessId] });
      setCode('');
      setDescription('');
      setExpiresAtDay('');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/businesses/${businessId}/promo-codes/${id}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', businessId] });
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="card flex flex-wrap gap-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">Code</label>
          <input
            className="input max-w-[160px] uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input max-w-[120px]"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="input max-w-[100px]"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Min order</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input max-w-[100px]"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Max uses</label>
          <input
            type="number"
            min="1"
            className="input max-w-[100px]"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('monetization.expirationDate')}</label>
          <input
            type="date"
            className="input max-w-[160px]"
            value={expiresAtDay}
            onChange={(e) => setExpiresAtDay(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">{t('monetization.expirationOptional')}</p>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create promo
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : promos.length === 0 ? (
        <p className="text-gray-400 text-sm">No promo codes yet.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Code</th>
                <th className="px-4 py-3 font-medium text-gray-400">Discount</th>
                <th className="px-4 py-3 font-medium text-gray-400">Uses</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-mono">{promo.code}</td>
                  <td className="px-4 py-3">
                    {promo.discountType === 'percent'
                      ? `${promo.discountValue}%`
                      : `$${promo.discountValue}`}
                  </td>
                  <td className="px-4 py-3">
                    {promo.usedCount}
                    {promo.maxUses != null ? ` / ${promo.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {promo.expiresAt
                      ? formatDateDisplay(promo.expiresAt, locale)
                      : t('monetization.noExpiration')}
                  </td>
                  <td className="px-4 py-3">
                    {!promo.isActive
                      ? 'Inactive'
                      : isExpiredAt(promo.expiresAt)
                        ? t('monetization.expired')
                        : 'Active'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {promo.isActive && (
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300 text-xs"
                        onClick={() => deactivateMutation.mutate(promo.id)}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
