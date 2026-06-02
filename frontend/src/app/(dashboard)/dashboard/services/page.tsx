'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Plus, Clock, DollarSign, CreditCard, Pencil, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { ServicePackagesTab } from '@/components/services/service-packages-tab';
import { MultiServiceSettingsTab } from '@/components/services/multi-service-settings-tab';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AiSuggestionsStack } from '@/components/ai-suggestion-collapsible';
import { DashboardPageShell, DashboardPageToolbar } from '@/components/dashboard/dashboard-page-shell';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
import { ToggleChoice } from '@/components/ui/radio-choice';

type ServicesTab = 'categories' | 'types' | 'packages' | 'multiService';

interface ServiceCategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
}

interface ServiceRecord {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency?: string;
  prepaymentMode?: 'none' | 'full' | 'deposit';
  depositAmount?: number | null;
  categoryId?: string | null;
  category?: ServiceCategoryRecord | null;
}

interface ServiceFormState {
  name: string;
  durationMinutes: string;
  price: string;
  bufferMinutes: string;
  description: string;
  categoryId: string;
  onlinePaymentEnabled: boolean;
  prepaymentMode: 'full' | 'deposit';
  depositAmount: string;
}

const defaultForm = (): ServiceFormState => ({
  name: '',
  durationMinutes: '30',
  price: '',
  bufferMinutes: '0',
  description: '',
  categoryId: '',
  onlinePaymentEnabled: false,
  prepaymentMode: 'full',
  depositAmount: '',
});

function parseIntField(value: string, fallback = 0): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseFloatField(value: string, fallback = 0): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formToPayload(form: ServiceFormState, mode: 'create' | 'update' = 'create') {
  const depositAmount = parseFloatField(form.depositAmount);
  const base = {
    name: form.name,
    description: form.description || undefined,
    durationMinutes: parseIntField(form.durationMinutes, 30),
    bufferMinutes: parseIntField(form.bufferMinutes),
    price: parseFloatField(form.price),
    prepaymentMode: form.onlinePaymentEnabled ? form.prepaymentMode : 'none',
    depositAmount:
      form.onlinePaymentEnabled && form.prepaymentMode === 'deposit' && depositAmount > 0
        ? depositAmount
        : undefined,
  };
  if (mode === 'update') {
    return { ...base, categoryId: form.categoryId || null };
  }
  return { ...base, ...(form.categoryId ? { categoryId: form.categoryId } : {}) };
}

function serviceToForm(svc: ServiceRecord): ServiceFormState {
  const online = svc.prepaymentMode && svc.prepaymentMode !== 'none';
  return {
    name: svc.name,
    durationMinutes: String(svc.durationMinutes),
    price: String(Number(svc.price)),
    bufferMinutes: String(svc.bufferMinutes ?? 0),
    description: svc.description ?? '',
    categoryId: svc.categoryId ?? svc.category?.id ?? '',
    onlinePaymentEnabled: Boolean(online),
    prepaymentMode: svc.prepaymentMode === 'deposit' ? 'deposit' : 'full',
    depositAmount: svc.depositAmount != null ? String(Number(svc.depositAmount)) : '',
  };
}

function ServiceFormFields({
  form,
  setForm,
  stripeReady,
  categories,
  t,
}: {
  form: ServiceFormState;
  setForm: (f: ServiceFormState) => void;
  stripeReady: boolean;
  categories: ServiceCategoryRecord[];
  t: (key: string) => string;
}) {
  return (
    <>
      <div>
        <label className="label">{t('servicesPage.serviceCategory')}</label>
        <select
          className="input"
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">{t('servicesPage.noCategory')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">{t('servicesPage.name')}</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.description')}</label>
        <input
          className="input"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.durationMinutes')}</label>
        <input
          type="text"
          inputMode="numeric"
          className="input"
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: e.target.value.replace(/\D/g, '') })}
          onFocus={(e) => e.target.select()}
          required
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.bufferMinutes')}</label>
        <input
          type="text"
          inputMode="numeric"
          className="input"
          value={form.bufferMinutes}
          onChange={(e) => setForm({ ...form, bufferMinutes: e.target.value.replace(/\D/g, '') })}
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.price')}</label>
        <input
          type="text"
          inputMode="decimal"
          className="input"
          value={form.price}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
            setForm({ ...form, price: next });
          }}
          onFocus={(e) => e.target.select()}
          required
        />
      </div>
      <div className="md:col-span-2 space-y-3 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <ToggleChoice variant="dashboard"
          checked={form.onlinePaymentEnabled}
          disabled={!stripeReady}
          onChange={(onlinePaymentEnabled) =>
            setForm({
              ...form,
              onlinePaymentEnabled,
              prepaymentMode: onlinePaymentEnabled ? form.prepaymentMode : 'full',
            })
          }
          label={
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CreditCard className="w-4 h-4" />
              {t('servicesPage.onlinePayment')}
            </span>
          }
        />
        {!stripeReady && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('servicesPage.stripeRequired')}</p>
        )}
        {form.onlinePaymentEnabled && (
          <>
            <div>
              <label className="label">{t('servicesPage.paymentType')}</label>
              <select
                className="input"
                value={form.prepaymentMode}
                onChange={(e) =>
                  setForm({ ...form, prepaymentMode: e.target.value as 'full' | 'deposit' })
                }
              >
                <option value="full">{t('servicesPage.prepayFull')}</option>
                <option value="deposit">{t('servicesPage.prepayDeposit')}</option>
              </select>
            </div>
            {form.prepaymentMode === 'deposit' && (
              <div>
                <label className="label">{t('servicesPage.depositAmount')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input"
                  value={form.depositAmount}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
                    setForm({ ...form, depositAmount: next });
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function CategoriesTab({
  businessId,
  categories,
  services,
  categoryName,
  setCategoryName,
  categorySortOrder,
  setCategorySortOrder,
  showCategoryForm,
  setShowCategoryForm,
  createCategoryMutation,
  deleteCategoryMutation,
  t,
}: {
  businessId: string;
  categories: ServiceCategoryRecord[];
  services: ServiceRecord[];
  categoryName: string;
  setCategoryName: (v: string) => void;
  categorySortOrder: string;
  setCategorySortOrder: (v: string) => void;
  showCategoryForm: boolean;
  setShowCategoryForm: (v: boolean) => void;
  createCategoryMutation: { mutate: () => void; isPending: boolean };
  deleteCategoryMutation: { mutate: (id: string) => void; isPending: boolean };
  t: (key: string) => string;
}) {
  const serviceCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const svc of services) {
      const id = svc.categoryId ?? svc.category?.id;
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [services]);

  if (!businessId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t('servicesPage.categoriesTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('servicesPage.categoriesSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          className="btn-primary inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('servicesPage.addCategory')}
        </button>
      </div>

      {showCategoryForm && (
        <form
          className="card grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            createCategoryMutation.mutate();
          }}
        >
          <div>
            <label className="label">{t('servicesPage.categoryName')}</label>
            <input
              className="input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t('servicesPage.categorySortOrder')}</label>
            <input
              type="text"
              inputMode="numeric"
              className="input"
              value={categorySortOrder}
              onChange={(e) => setCategorySortOrder(e.target.value.replace(/\D/g, ''))}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createCategoryMutation.isPending} className="btn-primary inline-flex items-center gap-2">
              {createCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('servicesPage.create')}
            </button>
            <button type="button" onClick={() => setShowCategoryForm(false)} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">{t('servicesPage.noCategories')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.categoryName')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.categorySortOrder')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.serviceTypesCount')}</th>
                <th className="px-4 py-3 font-medium text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400">{cat.sortOrder}</td>
                  <td className="px-4 py-3 text-gray-400">{serviceCountByCategory.get(cat.id) ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteCategoryMutation.mutate(cat.id)}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                      aria-label={t('common.delete')}
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

function ServiceTypesTab({
  categories,
  services,
  isLoading,
  stripeReady,
  showForm,
  setShowForm,
  editingId,
  setEditingId,
  form,
  setForm,
  formError,
  setFormError,
  createMutation,
  updateMutation,
  startEdit,
  cancelEdit,
  groupedServices,
  t,
}: {
  categories: ServiceCategoryRecord[];
  services: ServiceRecord[] | undefined;
  isLoading: boolean;
  stripeReady: boolean;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingId: string | null;
  setEditingId: (v: string | null) => void;
  form: ServiceFormState;
  setForm: (f: ServiceFormState) => void;
  formError: string | null;
  setFormError: (v: string | null) => void;
  createMutation: { mutate: (data: ReturnType<typeof formToPayload>) => void; isPending: boolean };
  updateMutation: { mutate: (args: { id: string; data: ReturnType<typeof formToPayload> }) => void; isPending: boolean };
  startEdit: (svc: ServiceRecord) => void;
  cancelEdit: () => void;
  groupedServices: Array<{ label: string; sortOrder: number; items: ServiceRecord[] }>;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t('servicesPage.serviceTypesTitle')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('servicesPage.serviceTypesSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(defaultForm());
            setFormError(null);
          }}
          className="btn-primary inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('servicesPage.addService')}
        </button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-amber-500/90">{t('servicesPage.createCategoryFirst')}</p>
      )}

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">{t('servicesPage.newService')}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formToPayload(form, 'create'));
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <ServiceFormFields form={form} setForm={setForm} stripeReady={stripeReady} categories={categories} t={t} />
            {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('servicesPage.saving') : t('servicesPage.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="card text-center py-12 text-gray-500">{t('common.loading')}</div>
      ) : !services || services.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{t('servicesPage.noServices')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedServices.map((group) => (
            <section
              key={group.label}
              className="card overflow-hidden p-0 border border-gray-800"
            >
              <header className="px-4 py-3 border-b border-gray-800 bg-gray-900/30">
                <h3 className="text-sm font-semibold text-gray-100">{group.label}</h3>
              </header>
              <div className="divide-y divide-gray-800">
                {group.items.map((svc) => (
                  <div key={svc.id} className="px-4 py-4">
                      {editingId === svc.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateMutation.mutate({ id: svc.id, data: formToPayload(form, 'update') });
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <ServiceFormFields form={form} setForm={setForm} stripeReady={stripeReady} categories={categories} t={t} />
                          {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
                          <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                                  {t('servicesPage.saving')}
                                </>
                              ) : (
                                t('servicesPage.save')
                              )}
                            </button>
                            <button type="button" onClick={cancelEdit} className="btn-secondary">
                              {t('common.cancel')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{svc.name}</p>
                            {svc.description && <p className="text-sm text-gray-500">{svc.description}</p>}
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {svc.durationMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />${svc.price}
                              </span>
                              {svc.prepaymentMode && svc.prepaymentMode !== 'none' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-600/15 text-violet-300">
                                  {svc.prepaymentMode === 'full'
                                    ? t('servicesPage.badgeFullPrepay')
                                    : t('servicesPage.badgeDeposit')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEdit(svc)}
                            className="text-gray-400 hover:text-gray-200 p-2"
                            aria-label={t('servicesPage.editService')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ServicesTab>('types');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState('0');

  const tabs: { id: ServicesTab; label: string }[] = [
    { id: 'types', label: t('servicesPage.tabServiceTypes') },
    { id: 'categories', label: t('servicesPage.tabCategories') },
    { id: 'packages', label: t('servicesPage.tabPackages') },
    { id: 'multiService', label: t('servicesPage.tabMultiService') },
  ];

  const { data: stripeConnect } = useQuery({
    queryKey: ['stripe-connect', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/billing/stripe-connect`);
      return res.data || res;
    },
    enabled: !!business?.id,
  });

  const stripeReady = Boolean(stripeConnect?.configured && stripeConnect?.chargesEnabled);

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/service-categories`);
      return (data.data || data || []) as ServiceCategoryRecord[];
    },
    enabled: !!business?.id,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/businesses/${business!.id}/service-categories`, {
        name: categoryName,
        sortOrder: parseIntField(categorySortOrder),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      setCategoryName('');
      setCategorySortOrder('0');
      setShowCategoryForm(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/businesses/${business!.id}/service-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return (data.data || data || []) as ServiceRecord[];
    },
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof formToPayload>) => {
      const res = await api.post(`/businesses/${business!.id}/services`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setForm(defaultForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReturnType<typeof formToPayload> }) => {
      const res = await api.put(`/businesses/${business!.id}/services/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingId(null);
      setForm(defaultForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const startEdit = (svc: ServiceRecord) => {
    setEditingId(svc.id);
    setShowForm(false);
    setForm(serviceToForm(svc));
    setFormError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm());
    setFormError(null);
  };

  const groupedServices = useMemo(() => {
    const list = services ?? [];
    const groups = new Map<string, { label: string; sortOrder: number; items: ServiceRecord[] }>();
    for (const svc of list) {
      const key = svc.categoryId ?? svc.category?.id ?? '__none__';
      if (!groups.has(key)) {
        groups.set(key, {
          label:
            svc.category?.name ??
            categories.find((c) => c.id === svc.categoryId)?.name ??
            t('servicesPage.uncategorizedGroup'),
          sortOrder:
            svc.category?.sortOrder ??
            categories.find((c) => c.id === svc.categoryId)?.sortOrder ??
            9999,
          items: [],
        });
      }
      groups.get(key)!.items.push(svc);
    }
    return Array.from(groups.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
    );
  }, [services, categories, t]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardPageShell
        ai={
          <AiSuggestionsStack>
            <AiPagePanel
              suggestions={AI_PAGE_SUGGESTIONS['/dashboard/services']}
              context={{ route: '/dashboard/services' }}
            />
          </AiSuggestionsStack>
        }
      >
        <DashboardPageToolbar
          title={t('servicesPage.title')}
          subtitle={t('servicesPage.subtitle')}
        />
      </DashboardPageShell>

      <div className="card overflow-hidden p-0">
        <div className="p-6 pt-4">
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

      {tab === 'categories' && business?.id && (
        <CategoriesTab
          businessId={business.id}
          categories={categories}
          services={services ?? []}
          categoryName={categoryName}
          setCategoryName={setCategoryName}
          categorySortOrder={categorySortOrder}
          setCategorySortOrder={setCategorySortOrder}
          showCategoryForm={showCategoryForm}
          setShowCategoryForm={setShowCategoryForm}
          createCategoryMutation={createCategoryMutation}
          deleteCategoryMutation={deleteCategoryMutation}
          t={t}
        />
      )}

      {tab === 'packages' && business?.id && <ServicePackagesTab businessId={business.id} />}
      {tab === 'multiService' && business?.id && (
        <MultiServiceSettingsTab
          businessId={business.id}
          services={(services ?? []).map((svc) => ({ id: svc.id, name: svc.name }))}
          categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
        />
      )}

      {tab === 'types' && (
        <ServiceTypesTab
          categories={categories}
          services={services}
          isLoading={isLoading}
          stripeReady={stripeReady}
          showForm={showForm}
          setShowForm={setShowForm}
          editingId={editingId}
          setEditingId={setEditingId}
          form={form}
          setForm={setForm}
          formError={formError}
          setFormError={setFormError}
          createMutation={createMutation}
          updateMutation={updateMutation}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          groupedServices={groupedServices}
          t={t}
        />
      )}
        </div>
      </div>
    </div>
  );
}
