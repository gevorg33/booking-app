'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { confirmDialog } from '@/lib/app-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { CheckboxChoice } from '@/components/ui/radio-choice';
import { dateKeyToExpiresAtEndOfDay, formatDateDisplay } from '@/lib/date-format';
import {
  buildPackageItemsPayload,
  defaultPackageFormState,
  packageLocalizedNamesPayload,
  packageToFormState,
  previewPackageFromForm,
  resolvePackageStatus,
  type ServicePackageRecord,
} from '@/lib/service-packages';
import { useBusinessCurrency } from '@/hooks/use-business-currency';
import { useBusinessEnabledLocales } from '@/hooks/use-business-enabled-locales';
import { LocalizedNamesFields } from '@/components/services/localized-names-fields';

type PackageFilter = 'all' | 'active' | 'inactive' | 'expired';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface ServicePackagesTabProps {
  businessId: string;
}

export function ServicePackagesTab({ businessId }: ServicePackagesTabProps) {
  const { t, locale } = useI18n();
  const { formatMoney } = useBusinessCurrency();
  const { enabledLocales } = useBusinessEnabledLocales();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<PackageFilter>('all');
  const [form, setForm] = useState(defaultPackageFormState());
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [graceHours, setGraceHours] = useState('0');

  const { data: businessData } = useQuery({
    queryKey: ['business-settings', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrap<{ settings?: Record<string, unknown> }>(data);
    },
  });

  useEffect(() => {
    const value = Number(
      (businessData?.settings?.publicBooking as Record<string, unknown> | undefined)
        ?.packageCheckoutGraceHours ?? 0,
    );
    if (Number.isFinite(value)) queueMicrotask(() => setGraceHours(String(value)));
  }, [businessData]);

  const saveGraceMutation = useMutation({
    mutationFn: async () => {
      const hours = Math.max(0, parseInt(graceHours, 10) || 0);
      const settings = {
        ...(businessData?.settings ?? {}),
        publicBooking: {
          ...((businessData?.settings?.publicBooking as Record<string, unknown>) ?? {}),
          packageCheckoutGraceHours: hours,
        },
      };
      const { data } = await api.put(`/businesses/${businessId}`, { settings });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<
        Array<{ id: string; name: string; price: number; durationMinutes: number; currency?: string }>
      >(data);
    },
  });

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['service-packages', businessId, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ includeInactive: 'true' });
      if (filter !== 'all') params.set('filter', filter);
      const { data } = await api.get(`/businesses/${businessId}/packages?${params}`);
      return unwrap<ServicePackageRecord[]>(data);
    },
  });

  const selectedItems = useMemo(
    () =>
      form.selectedServiceIds.map((serviceId) => {
        const svc = services.find((s) => s.id === serviceId);
        return {
          serviceId,
          quantity: Math.max(1, form.quantities[serviceId] ?? 1),
          unitPrice: Number(svc?.price ?? 0),
        };
      }),
    [form.quantities, form.selectedServiceIds, services],
  );

  const preview = previewPackageFromForm({
    selectedItems,
    discountType: form.discountType,
    discountValue: parseFloat(form.discountValue) || 0,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = form.expiresAtDay
        ? dateKeyToExpiresAtEndOfDay(form.expiresAtDay)
        : null;
      const payload = {
        name: form.name,
        localizedNames: packageLocalizedNamesPayload(form),
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue) || 0,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
        expiresAt,
        items: buildPackageItemsPayload(form.selectedServiceIds, form.quantities),
      };
      if (editingPackageId) {
        const { data } = await api.put(
          `/businesses/${businessId}/packages/${editingPackageId}`,
          payload,
        );
        return data;
      }
      const { data } = await api.post(`/businesses/${businessId}/packages`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', businessId] });
      resetForm();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data } = await api.patch(
        `/businesses/${businessId}/packages/${packageId}/deactivate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', businessId] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data } = await api.patch(
        `/businesses/${businessId}/packages/${packageId}/activate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', businessId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (packageId: string) => {
      await api.delete(`/businesses/${businessId}/packages/${packageId}`);
    },
    onSuccess: (_data, packageId) => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', businessId] });
      if (editingPackageId === packageId) resetForm();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data } = await api.post(
        `/businesses/${businessId}/packages/${packageId}/duplicate`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages', businessId] });
    },
  });

  const resetForm = () => {
    setForm(defaultPackageFormState());
    setEditingPackageId(null);
    setShowForm(false);
  };

  const startEditing = (pkg: ServicePackageRecord) => {
    setEditingPackageId(pkg.id);
    setShowForm(true);
    setForm(packageToFormState(pkg));
  };

  const toggleService = (serviceId: string) => {
    setForm((prev) => {
      const selected = prev.selectedServiceIds.includes(serviceId)
        ? prev.selectedServiceIds.filter((id) => id !== serviceId)
        : [...prev.selectedServiceIds, serviceId];
      const quantities = { ...prev.quantities };
      if (!selected.includes(serviceId)) delete quantities[serviceId];
      else if (!quantities[serviceId]) quantities[serviceId] = 1;
      return { ...prev, selectedServiceIds: selected, quantities };
    });
  };

  const filters: { id: PackageFilter; label: string }[] = [
    { id: 'all', label: t('servicesPage.packagesFilterAll') },
    { id: 'active', label: t('servicesPage.packagesFilterActive') },
    { id: 'inactive', label: t('servicesPage.packagesFilterInactive') },
    { id: 'expired', label: t('servicesPage.packagesFilterExpired') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            {t('servicesPage.packagesTitle')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('servicesPage.packagesSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('servicesPage.packagesAdd')}
        </button>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="label">{t('servicesPage.packagesCheckoutGrace')}</label>
          <p className="text-xs text-gray-500 mb-2">{t('servicesPage.packagesCheckoutGraceHint')}</p>
          <input
            type="number"
            min="0"
            className="input max-w-[120px]"
            value={graceHours}
            onChange={(e) => setGraceHours(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => saveGraceMutation.mutate()}
          disabled={saveGraceMutation.isPending}
          className="btn-secondary text-sm"
        >
          {saveGraceMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('servicesPage.packagesSaveGrace')
          )}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === item.id
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          className="card grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div>
            <label className="label">{t('servicesPage.packagesName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <LocalizedNamesFields
            value={form.localizedNames}
            onChange={(localizedNames) => setForm({ ...form, localizedNames })}
            enabledLocales={enabledLocales}
            t={t}
          />
          <div>
            <label className="label">{t('servicesPage.packagesDisplayOrder')}</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('servicesPage.description')}</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('servicesPage.packagesImageUrl')}</label>
            <input
              className="input"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://"
            />
          </div>
          <div>
            <label className="label">{t('servicesPage.packagesDiscountType')}</label>
            <select
              className="input"
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })
              }
            >
              <option value="percent">{t('servicesPage.packagesDiscountPercent')}</option>
              <option value="fixed">{t('servicesPage.packagesDiscountFixed')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('servicesPage.packagesDiscountValue')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">{t('servicesPage.packagesExpiresAt')}</label>
            <DatePicker
              value={form.expiresAtDay}
              clearable
              onChange={(expiresAtDay) => setForm({ ...form, expiresAtDay })}
            />
            <p className="text-xs text-gray-500 mt-1">{t('servicesPage.packagesExpiresOptional')}</p>
          </div>
          <div className="md:col-span-2 rounded-lg border border-gray-800 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-300">{t('servicesPage.packagesIncludedServices')}</p>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">{t('servicesPage.noServices')}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((svc) => {
                  const selected = form.selectedServiceIds.includes(svc.id);
                  return (
                    <li key={svc.id} className={selected ? 'sm:col-span-2' : undefined}>
                      <div className="flex flex-wrap items-center gap-3">
                        <CheckboxChoice
                          className="min-h-[44px] flex-1 rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                          checked={selected}
                          onChange={(checked) => {
                            if (checked !== selected) toggleService(svc.id);
                          }}
                          label={`${svc.name} (${formatMoney(svc.price, svc.currency)})`}
                          labelClassName="text-sm text-gray-200"
                        />
                        {selected && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500">{t('servicesPage.packagesQty')}</span>
                            <input
                              type="number"
                              min="1"
                              className="input max-w-[80px]"
                              value={form.quantities[svc.id] ?? 1}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  quantities: {
                                    ...form.quantities,
                                    [svc.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  },
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="md:col-span-2 rounded-lg bg-gray-900/60 border border-gray-800 p-4 text-sm">
              <p className="text-gray-400">{t('servicesPage.packagesPricingPreview')}</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <span>
                  {t('servicesPage.packagesRegularTotal')}: {formatMoney(preview.regularTotal)}
                </span>
                <span className="text-emerald-400 font-medium">
                  {t('servicesPage.packagesPrice')}: {formatMoney(preview.packagePrice)}
                </span>
                <span className="text-blue-400">
                  {t('servicesPage.packagesSavings')}: {formatMoney(preview.savings)} (
                  {preview.savingsPercent.toFixed(0)}%)
                </span>
              </div>
            </div>
          )}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending || form.selectedServiceIds.length === 0}
              className="btn-primary inline-flex items-center gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingPackageId ? t('servicesPage.save') : t('servicesPage.packagesCreate')}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : packages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">{t('servicesPage.packagesEmpty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesName')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesIncludes')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesPrice')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesExpiresAt')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesStatus')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('servicesPage.packagesActions')}</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const status = pkg.status ?? resolvePackageStatus(pkg);
                const includes = (pkg.items ?? [])
                  .map((item) => `${item.service?.name ?? item.serviceId} ×${item.quantity}`)
                  .join(', ');
                const pricing = pkg.preview?.pricing;
                return (
                  <tr key={pkg.id} className="border-b border-gray-800/80 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{pkg.name}</div>
                      {pricing?.savings ? (
                        <div className="text-xs text-emerald-400 mt-1">
                          {t('servicesPage.packagesSave')} {pricing.savingsPercent?.toFixed(0)}%
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs">{includes}</td>
                    <td className="px-4 py-3">
                      <div>{formatMoney(pricing?.packagePrice ?? 0)}</div>
                      <div className="text-xs text-gray-500 line-through">
                        {formatMoney(pricing?.regularTotal ?? 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {pkg.expiresAt
                        ? formatDateDisplay(pkg.expiresAt, locale)
                        : t('servicesPage.packagesNoExpiration')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          status === 'active'
                            ? 'bg-green-600/10 text-green-400'
                            : status === 'expired'
                              ? 'bg-amber-600/10 text-amber-400'
                              : 'bg-gray-600/10 text-gray-400'
                        }`}
                      >
                        {status === 'active'
                          ? t('servicesPage.packagesStatusActive')
                          : status === 'expired'
                            ? t('servicesPage.packagesStatusExpired')
                            : t('servicesPage.packagesStatusInactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(pkg)}
                          className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 hover:text-white inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          {t('servicesPage.packagesEdit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateMutation.mutate(pkg.id)}
                          className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 hover:text-white inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {t('servicesPage.packagesDuplicate')}
                        </button>
                        {status === 'inactive' ? (
                          <button
                            type="button"
                            onClick={() => activateMutation.mutate(pkg.id)}
                            className="text-xs px-2 py-1 rounded bg-emerald-600/10 text-emerald-400"
                          >
                            {t('servicesPage.packagesActivate')}
                          </button>
                        ) : status === 'active' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (await confirmDialog({ message: t('servicesPage.packagesDeactivateConfirm'), destructive: true })) {
                                deactivateMutation.mutate(pkg.id);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-amber-600/10 text-amber-400"
                          >
                            {t('servicesPage.packagesDeactivate')}
                          </button>
                        ) : null}
                        {status !== 'active' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (await confirmDialog({ message: t('servicesPage.packagesDeleteConfirm'), destructive: true })) {
                                deleteMutation.mutate(pkg.id);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-red-600/10 text-red-400 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {t('servicesPage.packagesDelete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
