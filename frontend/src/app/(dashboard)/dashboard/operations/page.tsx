'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, Warehouse, BookOpen } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { InventoryServiceLinks } from '@/components/operations/inventory-service-links';
import { SchedulingResourcesPanel } from '@/components/operations/scheduling-resources-panel';
import { ContextualHelpButton } from '@/components/help/contextual-help';
import { DatePicker } from '@/components/ui/date-picker';

type Tab = 'locations' | 'resources' | 'inventory' | 'expenses' | 'commissions' | 'pl';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function OperationsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const [tab, setTab] = useState<Tab>('locations');
  const [plRange, setPlRange] = useState(defaultDateRange);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'locations', label: t('operations.locations') },
    { id: 'resources', label: t('operations.resources') },
    { id: 'inventory', label: t('operations.inventory') },
    { id: 'expenses', label: t('operations.expenses') },
    { id: 'commissions', label: t('operations.commissions') },
    { id: 'pl', label: t('operations.plSummary') },
  ];

  const plParams = useMemo(() => ({ from: plRange.from, to: plRange.to }), [plRange]);

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['analytics-pl', business?.id, plParams],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/analytics/pl`, { params: plParams });
      return unwrap<{
        revenue: number;
        expenses: number;
        commissions: number;
        netProfit: number;
      }>(data);
    },
    enabled: !!business?.id && tab === 'pl',
  });

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Warehouse className="w-6 h-6 text-amber-400" />
              {t('operations.title')}
              <ContextualHelpButton topicId="operations-inventory" />
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t('operations.subtitle')}</p>
          </div>
          <Link
            href="/dashboard/guide#overview"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/15 px-3 py-2 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            {t('operations.viewGuide')}
          </Link>
        </div>
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

      {business?.id && tab === 'locations' && <LocationsTab businessId={business.id} />}
      {business?.id && tab === 'resources' && <SchedulingResourcesPanel businessId={business.id} />}
      {business?.id && tab === 'inventory' && <InventoryTab businessId={business.id} />}
      {business?.id && tab === 'expenses' && <ExpensesTab businessId={business.id} />}
      {business?.id && tab === 'commissions' && <CommissionsTab businessId={business.id} />}
      {tab === 'pl' && (
        <div className="space-y-6">
          <div className="card flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">{t('reports.dateFrom')}</label>
              <DatePicker
                className="max-w-[180px]"
                value={plRange.from}
                onChange={(from) => setPlRange((r) => ({ ...r, from }))}
              />
            </div>
            <div>
              <label className="label">{t('reports.dateTo')}</label>
              <DatePicker
                className="max-w-[180px]"
                value={plRange.to}
                onChange={(to) => setPlRange((r) => ({ ...r, to }))}
              />
            </div>
          </div>
          {plLoading ? (
            <div className="card flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : pl ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">${pl.revenue.toFixed(2)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500">Expenses</p>
                <p className="text-2xl font-bold text-orange-400">${pl.expenses.toFixed(2)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500">Commissions</p>
                <p className="text-2xl font-bold text-violet-400">${pl.commissions.toFixed(2)}</p>
              </div>
              <div className="card">
                <p className="text-xs text-gray-500">Net profit</p>
                <p className={`text-2xl font-bold ${pl.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${pl.netProfit.toFixed(2)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function LocationsTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/locations`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/locations`, form);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', businessId] });
      setForm({ name: '', address: '', phone: '' });
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="card grid grid-cols-1 md:grid-cols-3 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="md:col-span-3">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add location
          </button>
        </div>
      </form>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : locations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No locations yet</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {locations.map((loc) => (
              <li key={loc.id} className="py-4 flex justify-between gap-4">
                <div>
                  <p className="font-medium">{loc.name}</p>
                  {loc.address && <p className="text-sm text-gray-400">{loc.address}</p>}
                  {loc.phone && <p className="text-sm text-gray-500">{loc.phone}</p>}
                </div>
                {loc.isDefault && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-400 h-fit">Default</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InventoryTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', sku: '', quantityOnHand: '0', unitCost: '0', retailPrice: '0' });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/inventory/products`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/inventory/products`, {
        name: form.name,
        sku: form.sku || undefined,
        quantityOnHand: parseInt(form.quantityOnHand, 10),
        unitCost: parseFloat(form.unitCost),
        retailPrice: parseFloat(form.retailPrice),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', businessId] });
      setForm({ name: '', sku: '', quantityOnHand: '0', unitCost: '0', retailPrice: '0' });
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
          <label className="label">Product name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div>
          <label className="label">Quantity on hand</label>
          <input type="number" className="input" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })} />
        </div>
        <div>
          <label className="label">Unit cost</label>
          <input type="number" step="0.01" className="input" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
        </div>
        <div>
          <label className="label">Retail price</label>
          <input type="number" step="0.01" className="input" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add product
          </button>
        </div>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No products yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 font-medium text-gray-400">SKU</th>
                <th className="px-4 py-3 font-medium text-gray-400">Qty</th>
                <th className="px-4 py-3 font-medium text-gray-400">Retail</th>
                <th className="px-4 py-3 font-medium text-gray-400">Unit cost</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.sku || '—'}</td>
                  <td className="px-4 py-3">{p.quantityOnHand}</td>
                  <td className="px-4 py-3">${Number(p.retailPrice ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">${Number(p.unitCost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InventoryServiceLinks businessId={businessId} products={products} />
    </div>
  );
}

function ExpensesTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/expenses`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/expenses`, {
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        expenseDate: form.expenseDate,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', businessId] });
      setForm({ category: '', description: '', amount: '', expenseDate: new Date().toISOString().slice(0, 10) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/businesses/${businessId}/expenses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', businessId] }),
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
          <label className="label">Category</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <label className="label">Date</label>
          <DatePicker value={form.expenseDate} onChange={(expenseDate) => setForm({ ...form, expenseDate })} required />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add expense
          </button>
        </div>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No expenses yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 font-medium text-gray-400">Category</th>
                <th className="px-4 py-3 font-medium text-gray-400">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3">{exp.expenseDate}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{exp.category}</span>
                    {exp.description && <p className="text-xs text-gray-500">{exp.description}</p>}
                  </td>
                  <td className="px-4 py-3">${Number(exp.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(exp.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

function CommissionsTab({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ type: 'percent', value: '10' });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['commissions', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/commissions`);
      return unwrap<any[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/commissions`, {
        type: form.type,
        value: parseFloat(form.value),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions', businessId] });
      setForm({ type: 'percent', value: '10' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/businesses/${businessId}/commissions/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['commissions', businessId] }),
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
          <label className="label">Type</label>
          <select className="input max-w-[140px]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
        </div>
        <div>
          <label className="label">Value</label>
          <input type="number" step="0.01" className="input max-w-[140px]" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
        </div>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add rule
        </button>
      </form>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : rules.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No commission rules yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                <th className="px-4 py-3 font-medium text-gray-400">Value</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 capitalize">{rule.type}</td>
                  <td className="px-4 py-3">
                    {rule.type === 'percent' ? `${Number(rule.value)}%` : `$${Number(rule.value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
