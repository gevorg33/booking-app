'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { CustomerSelect } from '@/components/customers/customer-select';

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
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('50');
  const [currency, setCurrency] = useState('USD');

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['gift-cards', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/gift-cards`, {
        amount: parseFloat(amount),
        currency,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      setAmount('50');
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
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        card.isActive ? 'bg-green-600/10 text-green-400' : 'bg-gray-600/10 text-gray-400'
                      }`}
                    >
                      {card.isActive ? 'Active' : 'Inactive'}
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
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    price: '99',
    billingInterval: 'monthly',
    visitCredits: '4',
  });
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['membership-plans', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/memberships/plans`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/memberships/plans`, {
        name: form.name,
        price: parseFloat(form.price),
        billingInterval: form.billingInterval,
        visitCredits: parseInt(form.visitCredits, 10),
        currency: 'USD',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans', businessId] });
      setForm({ name: '', price: '99', billingInterval: 'monthly', visitCredits: '4' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/memberships/assign`, {
        customerId: assignCustomerId,
        planId: assignPlanId,
      });
      return data;
    },
    onSuccess: () => {
      setAssignCustomerId('');
      setAssignPlanId('');
    },
  });

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
          <label className="label">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Billing interval</label>
          <select
            className="input"
            value={form.billingInterval}
            onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="label">Visit credits</label>
          <input
            type="number"
            min="0"
            className="input"
            value={form.visitCredits}
            onChange={(e) => setForm({ ...form, visitCredits: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create plan
          </button>
        </div>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No membership plans yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-400">Price</th>
                <th className="px-4 py-3 font-medium text-gray-400">Interval</th>
                <th className="px-4 py-3 font-medium text-gray-400">Credits</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">${Number(plan.price).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{plan.billingInterval}</td>
                  <td className="px-4 py-3">{plan.visitCredits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {plans.length > 0 && (
        <form
          className="card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            assignMutation.mutate();
          }}
        >
          <h3 className="font-semibold">Assign plan to customer</h3>
          <CustomerSelect businessId={businessId} value={assignCustomerId} onChange={setAssignCustomerId} required />
          <div>
            <label className="label">Plan</label>
            <select
              className="input max-w-md"
              value={assignPlanId}
              onChange={(e) => setAssignPlanId(e.target.value)}
              required
            >
              <option value="">Select plan…</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={assignMutation.isPending} className="btn-primary">
            Assign membership
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

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['loyalty-settings', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/loyalty/settings`);
      return unwrap<{ earnPercentCashback: number; bonusDollarValue: number }>(res);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.patch(`/businesses/${businessId}/loyalty/settings`, {
        earnPercentCashback: parseFloat(earnPercent),
      });
      return unwrap<{ earnPercentCashback: number }>(res);
    },
    onSuccess: (data) => {
      setEarnPercent(String(data.earnPercentCashback));
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings', businessId] });
    },
  });

  useEffect(() => {
    if (settings?.earnPercentCashback != null) {
      setEarnPercent(String(settings.earnPercentCashback));
    }
  }, [settings?.earnPercentCashback]);

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
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [description, setDescription] = useState('');

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promo-codes', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/promo-codes`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/promo-codes`, {
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        description: description || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes', businessId] });
      setCode('');
      setDescription('');
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
                  <td className="px-4 py-3">{promo.isActive ? 'Active' : 'Inactive'}</td>
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
