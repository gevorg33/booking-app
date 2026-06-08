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
import { confirmDialog } from '@/lib/app-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { DashboardGiftCardsTab } from '@/components/gift-cards/dashboard-gift-cards-tab';
import { CheckboxChoice } from '@/components/ui/radio-choice';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { usePlanEntitlements, canUseFeature } from '@/lib/use-plan-entitlements';
import type { PlanFeatureFlag } from '@/lib/plan-entitlements';
import { useBusinessCurrency } from '@/hooks/use-business-currency';
import { useBusinessEnabledLocales } from '@/hooks/use-business-enabled-locales';
import { CatalogNotifyCustomersFields } from '@/components/dashboard/catalog-notify-customers-fields';
import {
  buildCatalogNotifySavePayload,
  buildCatalogNotifyBookUrl,
  catalogNotifyTemplateIsComplete,
  defaultCatalogNotifyFormState,
  formatCatalogNotifyDiscountLabel,
  type CatalogNotifyFormState,
  type CatalogNotifyPreviewContext,
} from '@/lib/catalog-notify-customers.util';

type Tab = 'gift-cards' | 'memberships' | 'loyalty' | 'promo-codes';

const TAB_FEATURE: Record<Tab, PlanFeatureFlag> = {
  'gift-cards': 'giftCards',
  memberships: 'memberships',
  loyalty: 'loyalty',
  'promo-codes': 'promoCodes',
};

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export default function MonetizationPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [tab, setTab] = useState<Tab>('promo-codes');
  const { data: entitlements } = usePlanEntitlements(business?.id);
  const tabAllowed = canUseFeature(entitlements, TAB_FEATURE[tab]);

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

      {!tabAllowed && entitlements && (
        <UpgradePrompt feature={TAB_FEATURE[tab]} className="mb-6" />
      )}
      {tabAllowed && tab === 'gift-cards' && business?.id && (
        <DashboardGiftCardsTab businessId={business.id} />
      )}
      {tabAllowed && tab === 'memberships' && business?.id && (
        <MembershipsTab businessId={business.id} />
      )}
      {tabAllowed && tab === 'loyalty' && business?.id && (
        <LoyaltyTab businessId={business.id} />
      )}
      {tabAllowed && tab === 'promo-codes' && business?.id && (
        <PromoCodesTab businessId={business.id} />
      )}
    </div>
  );
}

function defaultMembershipFormState() {
  return {
    name: '',
    serviceId: '',
    durationMonths: '3',
    customDurationMonths: '',
    includedAppointments: '6',
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: '5',
  };
}

function MembershipsTab({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { formatMoney } = useBusinessCurrency();
  const { enabledLocales } = useBusinessEnabledLocales();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultMembershipFormState);
  const [catalogNotify, setCatalogNotify] = useState<CatalogNotifyFormState>(
    defaultCatalogNotifyFormState(),
  );
  const [notifyError, setNotifyError] = useState<string | null>(null);
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
      return unwrap<unknown[]>(data);
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

  const catalogNotifyPreviewContext = useMemo((): CatalogNotifyPreviewContext => {
    const discountValue = parseFloat(form.discountValue) || 0;
    return {
      kind: 'subscription_plan',
      catalogName: form.name.trim() || t('catalogNotify.previewSamplePlanName'),
      discountLabel: formatCatalogNotifyDiscountLabel(
        form.discountType,
        discountValue,
        formatMoney,
      ),
      businessName: business?.name?.trim() || t('catalogNotify.previewSampleBusiness'),
      bookUrl: buildCatalogNotifyBookUrl(business?.slug ?? 'your-salon', 'subscription_plan'),
    };
  }, [business?.name, business?.slug, form.discountType, form.discountValue, form.name, formatMoney, t]);

  const resetMembershipForm = () => {
    setEditingPlanId(null);
    setForm(defaultMembershipFormState());
    setCatalogNotify(defaultCatalogNotifyFormState());
    setNotifyError(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        serviceId: form.serviceId,
        durationMonths: resolvedDurationMonths,
        includedAppointments: parseInt(form.includedAppointments, 10),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        ...buildCatalogNotifySavePayload(catalogNotify),
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
      resetMembershipForm();
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
      if (editingPlanId === planId) resetMembershipForm();
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
    setCatalogNotify(defaultCatalogNotifyFormState());
    setNotifyError(null);
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
          if (!catalogNotifyTemplateIsComplete(catalogNotify, enabledLocales)) {
            setNotifyError(t('catalogNotify.incompleteTemplate'));
            return;
          }
          setNotifyError(null);
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">{t('monetization.planName')}</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">{t('bookings.service')}</label>
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
            <option value="">{t('monetization.selectService')}</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('operations.durationMonths')}</label>
          <select
            className="input"
            value={form.durationMonths}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
          >
            <option value="3">{t('operations.months3')}</option>
            <option value="6">{t('operations.months6')}</option>
            <option value="12">{t('operations.months12')}</option>
            <option value="custom">{t('monetization.discountCustom')}</option>
          </select>
        </div>
        {form.durationMonths === 'custom' && (
          <div>
            <label className="label">{t('monetization.customMonths')}</label>
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
          <label className="label">{t('monetization.includedAppointments')}</label>
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
          <label className="label">{t('monetization.discountType')}</label>
          <select
            className="input"
            value={form.discountType}
            onChange={(e) =>
              setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })
            }
          >
            <option value="percent">{t('monetization.percentOff')}</option>
            <option value="fixed">{t('monetization.fixedAmountOff')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('monetization.discountValue')}</label>
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
              {t('monetization.regularTotal', { amount: formatMoney(preview.regularTotal) })}
            </p>
            <p>
              {t('monetization.subscriptionPriceLabel', {
                amount: formatMoney(preview.subscriptionPrice),
              })}
            </p>
            <p className="text-emerald-400">
              {t('monetization.customerSaves', { amount: formatMoney(preview.savings) })}
            </p>
          </div>
        )}
        <CatalogNotifyCustomersFields
          value={catalogNotify}
          onChange={setCatalogNotify}
          enabledLocales={enabledLocales}
          variableHints={t('catalogNotify.planVariables')}
          previewContext={catalogNotifyPreviewContext}
          t={t}
        />
        {notifyError ? (
          <p className="md:col-span-2 text-sm text-red-400">{notifyError}</p>
        ) : null}
        <div className="md:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingPlanId ? t('monetization.updatePlan') : t('monetization.createPlan')}
          </button>
          {editingPlanId && (
            <button
              type="button"
              className="btn-secondary text-sm ml-2"
              onClick={resetMembershipForm}
            >
              {t('monetization.cancelEdit')}
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
          <p className="text-gray-500 text-sm text-center py-12">{t('monetization.plansEmpty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('common.name')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableService')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableDuration')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableAppointments')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tablePrice')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableSavings')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableStatus')}</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">{plan.service?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {t('monetization.durationMonthsShort', { count: plan.durationMonths })}
                  </td>
                  <td className="px-4 py-3">{plan.includedAppointments}</td>
                  <td className="px-4 py-3">
                    {formatMoney(plan.preview?.pricing?.subscriptionPrice ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">
                    {formatMoney(plan.preview?.pricing?.savings ?? 0)}
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
                      {t('common.edit')}
                    </button>
                    {plan.isActive !== false ? (
                      <button
                        type="button"
                        className="text-xs text-red-400"
                        onClick={async () => {
                          if (!(await confirmDialog({ message: t('monetization.subscriptionPlanDeactivateConfirm'), destructive: true }))) return;
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
                          onClick={async () => {
                            if (!(await confirmDialog({ message: t('monetization.subscriptionPlanActivateConfirm') }))) return;
                            activateMutation.mutate(plan.id);
                          }}
                        >
                          {t('monetization.subscriptionPlanActivate')}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400"
                          disabled={deleteMutation.isPending}
                          onClick={async () => {
                            if (!(await confirmDialog({ message: t('monetization.subscriptionPlanDeleteConfirm'), destructive: true }))) return;
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
          <h3 className="font-semibold">{t('monetization.assignTitle')}</h3>
          <CustomerSelect businessId={businessId} value={assignCustomerId} onChange={setAssignCustomerId} required />
          <div>
            <label className="label">{t('bookings.service')}</label>
            <select
              className="input max-w-md"
              value={assignServiceId}
              onChange={(e) => {
                setAssignServiceId(e.target.value);
                setAssignPlanId('');
              }}
              required
            >
              <option value="">{t('monetization.selectService')}</option>
              {assignableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('monetization.planLabel')}</label>
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
                    ? t('monetization.assignSelectPlan')
                    : t('monetization.assignNoPlansForService')
                  : t('monetization.assignSelectServiceFirst')}
              </option>
              {plansForAssignService.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {formatSubscriptionPlanAssignLabel(plan)}
                </option>
              ))}
            </select>
            {assignServiceId && plansForAssignService.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                {t('monetization.assignMultiPlanHint', { count: plansForAssignService.length })}
              </p>
            )}
          </div>
          <button type="submit" disabled={assignMutation.isPending} className="btn-primary">
            {t('monetization.assignAction')}
          </button>
        </form>
      )}
    </div>
  );
}

function LoyaltyTab({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { formatMoney } = useBusinessCurrency();
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
      queueMicrotask(() => setEarnPercent(String(settings.earnPercentCashback)));
    }
    if (settings?.earnExcludedServiceIds) {
      queueMicrotask(() => setExcludedServiceIds(settings.earnExcludedServiceIds));
    }
  }, [settings?.earnPercentCashback, settings?.earnExcludedServiceIds]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['loyalty', businessId, customerId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/loyalty/customer/${customerId}`,
      );
      return unwrap<{ account: { pointsBalance: number; lifetimeEarned: number }; transactions: unknown[] }>(res);
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
        className="card w-full space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          settingsMutation.mutate();
        }}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-100">{t('monetization.loyaltyEarnRate')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('monetization.loyaltyEarnRateHint')}</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px]">
              <label className="label">{t('monetization.loyaltyEarnPercent')}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input max-w-[140px]"
                value={settings ? earnPercent : ''}
                onChange={(e) => setEarnPercent(e.target.value)}
                disabled={settingsLoading || !settings}
                required
              />
            </div>
            <button
              type="submit"
              disabled={settingsMutation.isPending || settingsLoading || !settings}
              className="btn-primary shrink-0"
            >
              {settingsMutation.isPending ? t('monetization.saving') : t('monetization.saveSettings')}
            </button>
          </div>
          {settings && (
            <p className="text-xs text-gray-500">
              {t('monetization.loyaltyEarnExample', {
                percent: settings.earnPercentCashback,
                amount: formatMoney(10 * settings.earnPercentCashback / 100),
              })}
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-gray-800 pt-6">
          <div>
            <label className="label">{t('monetization.loyaltyExcludedServices')}</label>
            <p className="mt-1 text-sm text-gray-500">{t('monetization.loyaltyExcludedServicesHint')}</p>
          </div>
          {services.length === 0 ? (
            <p className="text-sm text-gray-500">{t('monetization.loyaltyNoServices')}</p>
          ) : (
            <ul className="grid max-h-[min(20rem,50vh)] grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-800 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service) => (
                <li key={service.id}>
                  <CheckboxChoice
                    className="w-full rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                    checked={excludedServiceIds.includes(service.id)}
                    onChange={(checked) => {
                      setExcludedServiceIds((prev) =>
                        checked ? [...prev, service.id] : prev.filter((id) => id !== service.id),
                      );
                    }}
                    disabled={settingsLoading || !settings}
                    label={
                      <>
                        {service.name}
                        {service.isActive === false && (
                          <span className="ml-2 text-xs text-gray-500">
                            {t('monetization.inactiveService')}
                          </span>
                        )}
                      </>
                    }
                    labelClassName="text-sm text-gray-200"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      <div className="card space-y-4">
        <label className="label">{t('common.customer')}</label>
        <CustomerSelect businessId={businessId} value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId ? (
        <p className="text-gray-500 text-sm">{t('monetization.loyaltyBalanceHint')}</p>
      ) : isLoading || isFetching ? (
        <div className="card flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="card text-center">
              <p className="text-2xl font-bold text-emerald-400">{formatMoney(data.account.pointsBalance)}</p>
              <p className="text-xs text-gray-500">{t('monetization.bonusBalance')}</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold">{formatMoney(data.account.lifetimeEarned)}</p>
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
              <label className="label">{t('monetization.loyaltyNote')}</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="submit" disabled={adjustMutation.isPending} className="btn-primary">
              {t('monetization.adjustPoints')}
            </button>
          </form>

          {data.transactions.length > 0 && (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.loyaltyTableType')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.loyaltyTablePoints')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.loyaltyNote')}</th>
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
  const { formatMoney } = useBusinessCurrency();
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
      return unwrap<unknown[]>(data);
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
          <label className="label">{t('monetization.promoTableCode')}</label>
          <input
            className="input max-w-[160px] uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
        </div>
        <div>
          <label className="label">{t('monetization.promoType')}</label>
          <select
            className="input max-w-[120px]"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
          >
            <option value="percent">{t('monetization.promoPercent')}</option>
            <option value="fixed">{t('monetization.promoFixedAmount')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('monetization.promoValue')}</label>
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
          <label className="label">{t('monetization.promoMinOrder')}</label>
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
          <label className="label">{t('monetization.promoMaxUses')}</label>
          <input
            type="number"
            min="1"
            className="input max-w-[100px]"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label">{t('monetization.promoDescription')}</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('monetization.expirationDate')}</label>
          <DatePicker
            className="max-w-[200px]"
            value={expiresAtDay}
            clearable
            onChange={setExpiresAtDay}
          />
          <p className="text-xs text-gray-500 mt-1">{t('monetization.expirationOptional')}</p>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('monetization.promoCreate')}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : promos.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('monetization.promoEmpty')}</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.promoTableCode')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.promoTableDiscount')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.promoTableUses')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.tableStatus')}</th>
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
                      : formatMoney(promo.discountValue)}
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
                      ? t('monetization.promoStatusInactive')
                      : isExpiredAt(promo.expiresAt)
                        ? t('monetization.expired')
                        : t('monetization.promoStatusActive')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {promo.isActive && (
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300 text-xs"
                        onClick={() => deactivateMutation.mutate(promo.id)}
                      >
                        {t('monetization.promoDeactivate')}
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
