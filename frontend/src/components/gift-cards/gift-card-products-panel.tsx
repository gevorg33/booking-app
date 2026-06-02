'use client';

import { useMemo, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { CheckboxChoice } from '@/components/ui/radio-choice';

export interface GiftCardBundleLine {
  serviceId: string;
  serviceName: string;
  quantity: number;
}

export interface GiftCardProductBundle {
  id: string;
  name: string;
  lines: GiftCardBundleLine[];
  price: number;
}

export interface GiftCardPurchasableService {
  serviceId: string;
  price?: number | null;
}

export interface GiftCardPurchasablePackage {
  packageId: string;
  price?: number | null;
}

export interface GiftCardPurchasableSubscriptionPlan {
  planId: string;
  price?: number | null;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

interface PackageOption {
  id: string;
  name: string;
  packagePrice: number;
  itemSummary: string;
}

interface SubscriptionPlanOption {
  id: string;
  name: string;
  serviceName: string;
  subscriptionPrice: number;
}

interface GiftCardProductsPanelProps {
  services: ServiceOption[];
  packages: PackageOption[];
  subscriptionPlans: SubscriptionPlanOption[];
  purchasableServices: GiftCardPurchasableService[];
  purchasablePackages: GiftCardPurchasablePackage[];
  purchasableSubscriptionPlans: GiftCardPurchasableSubscriptionPlan[];
  bundles: GiftCardProductBundle[];
  onChange: (next: {
    purchasableServices: GiftCardPurchasableService[];
    purchasablePackages: GiftCardPurchasablePackage[];
    purchasableSubscriptionPlans: GiftCardPurchasableSubscriptionPlan[];
    bundles: GiftCardProductBundle[];
  }) => void;
}

const defaultBundleForm = () => ({
  name: '',
  price: '',
  selectedServiceIds: [] as string[],
  quantities: {} as Record<string, number>,
});

export function GiftCardProductsPanel({
  services,
  packages,
  subscriptionPlans,
  purchasableServices,
  purchasablePackages,
  purchasableSubscriptionPlans,
  bundles,
  onChange,
}: GiftCardProductsPanelProps) {
  const { t } = useI18n();
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [bundleForm, setBundleForm] = useState(defaultBundleForm());
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);

  const enabledServiceIds = useMemo(
    () => new Set(purchasableServices.map((s) => s.serviceId)),
    [purchasableServices],
  );
  const enabledPackageIds = useMemo(
    () => new Set(purchasablePackages.map((p) => p.packageId)),
    [purchasablePackages],
  );
  const enabledPlanIds = useMemo(
    () => new Set(purchasableSubscriptionPlans.map((p) => p.planId)),
    [purchasableSubscriptionPlans],
  );

  const emit = (next: Partial<{
    purchasableServices: GiftCardPurchasableService[];
    purchasablePackages: GiftCardPurchasablePackage[];
    purchasableSubscriptionPlans: GiftCardPurchasableSubscriptionPlan[];
    bundles: GiftCardProductBundle[];
  }>) =>
    onChange({
      purchasableServices,
      purchasablePackages,
      purchasableSubscriptionPlans,
      bundles,
      ...next,
    });

  const toggleService = (serviceId: string, enabled: boolean) => {
    if (enabled) {
      const svc = services.find((s) => s.id === serviceId);
      emit({
        purchasableServices: [...purchasableServices, { serviceId, price: svc?.price ?? null }],
      });
      return;
    }
    emit({
      purchasableServices: purchasableServices.filter((s) => s.serviceId !== serviceId),
      bundles: bundles
        .map((bundle) => ({
          ...bundle,
          lines: bundle.lines.filter((line) => line.serviceId !== serviceId),
        }))
        .filter((bundle) => bundle.lines.length > 0),
    });
  };

  const updateServicePrice = (serviceId: string, price: string) => {
    emit({
      purchasableServices: purchasableServices.map((s) =>
        s.serviceId === serviceId
          ? { ...s, price: price.trim() === '' ? null : Number(price) }
          : s,
      ),
    });
  };

  const togglePackage = (packageId: string, enabled: boolean) => {
    if (enabled) {
      const pkg = packages.find((p) => p.id === packageId);
      emit({
        purchasablePackages: [...purchasablePackages, { packageId, price: pkg?.packagePrice ?? null }],
      });
      return;
    }
    emit({ purchasablePackages: purchasablePackages.filter((p) => p.packageId !== packageId) });
  };

  const updatePackagePrice = (packageId: string, price: string) => {
    emit({
      purchasablePackages: purchasablePackages.map((p) =>
        p.packageId === packageId
          ? { ...p, price: price.trim() === '' ? null : Number(price) }
          : p,
      ),
    });
  };

  const togglePlan = (planId: string, enabled: boolean) => {
    if (enabled) {
      const plan = subscriptionPlans.find((p) => p.id === planId);
      emit({
        purchasableSubscriptionPlans: [
          ...purchasableSubscriptionPlans,
          { planId, price: plan?.subscriptionPrice ?? null },
        ],
      });
      return;
    }
    emit({
      purchasableSubscriptionPlans: purchasableSubscriptionPlans.filter((p) => p.planId !== planId),
    });
  };

  const updatePlanPrice = (planId: string, price: string) => {
    emit({
      purchasableSubscriptionPlans: purchasableSubscriptionPlans.map((p) =>
        p.planId === planId
          ? { ...p, price: price.trim() === '' ? null : Number(price) }
          : p,
      ),
    });
  };

  const bundlePreviewTotal = useMemo(() => {
    return bundleForm.selectedServiceIds.reduce((sum, serviceId) => {
      const svc = services.find((s) => s.id === serviceId);
      const qty = Math.max(1, bundleForm.quantities[serviceId] ?? 1);
      return sum + Number(svc?.price ?? 0) * qty;
    }, 0);
  }, [bundleForm.quantities, bundleForm.selectedServiceIds, services]);

  const resetBundleForm = () => {
    setBundleForm(defaultBundleForm());
    setEditingBundleId(null);
    setShowBundleForm(false);
  };

  const saveBundle = () => {
    if (!bundleForm.name.trim() || bundleForm.selectedServiceIds.length === 0) return;

    const lines: GiftCardBundleLine[] = bundleForm.selectedServiceIds.map((serviceId) => {
      const svc = services.find((s) => s.id === serviceId);
      return {
        serviceId,
        serviceName: svc?.name ?? serviceId,
        quantity: Math.max(1, bundleForm.quantities[serviceId] ?? 1),
      };
    });

    const price = Number(bundleForm.price) || bundlePreviewTotal;
    const payload: GiftCardProductBundle = {
      id: editingBundleId ?? crypto.randomUUID(),
      name: bundleForm.name.trim(),
      price,
      lines,
    };

    const nextBundles = editingBundleId
      ? bundles.map((b) => (b.id === editingBundleId ? payload : b))
      : [...bundles, payload];

    emit({ bundles: nextBundles });
    resetBundleForm();
  };

  const editBundle = (bundle: GiftCardProductBundle) => {
    setEditingBundleId(bundle.id);
    setShowBundleForm(true);
    setBundleForm({
      name: bundle.name,
      price: String(bundle.price),
      selectedServiceIds: bundle.lines.map((l) => l.serviceId),
      quantities: Object.fromEntries(bundle.lines.map((l) => [l.serviceId, l.quantity])),
    });
  };

  const removeBundle = (bundleId: string) => {
    emit({ bundles: bundles.filter((b) => b.id !== bundleId) });
    if (editingBundleId === bundleId) resetBundleForm();
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h3 className="font-medium text-gray-200">{t('monetization.giftCardPurchasableServices')}</h3>
        <p className="text-xs text-gray-500">{t('monetization.giftCardPurchasableServicesHint')}</p>
        {services.length === 0 ? (
          <p className="text-sm text-gray-500">{t('monetization.giftCardNoServices')}</p>
        ) : (
          <ul className="space-y-2">
            {services.map((svc) => {
              const enabled = enabledServiceIds.has(svc.id);
              const configured = purchasableServices.find((s) => s.serviceId === svc.id);
              return (
                <li
                  key={svc.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 px-3 py-2"
                >
                  <CheckboxChoice
                    className="min-h-[44px] min-w-[180px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                    checked={enabled}
                    onChange={(checked) => toggleService(svc.id, checked)}
                    label={svc.name}
                    labelClassName="text-sm text-gray-200"
                  />
                  <span className="text-xs text-gray-500">${Number(svc.price).toFixed(2)}</span>
                  {enabled && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input max-w-[120px] ml-auto"
                      placeholder={t('monetization.giftCardOverridePrice')}
                      value={configured?.price ?? ''}
                      onChange={(e) => updateServicePrice(svc.id, e.target.value)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="font-medium text-gray-200">{t('monetization.giftCardPurchasablePackages')}</h3>
        <p className="text-xs text-gray-500">{t('monetization.giftCardPurchasablePackagesHint')}</p>
        {packages.length === 0 ? (
          <p className="text-sm text-gray-500">{t('monetization.giftCardNoPackages')}</p>
        ) : (
          <ul className="space-y-2">
            {packages.map((pkg) => {
              const enabled = enabledPackageIds.has(pkg.id);
              const configured = purchasablePackages.find((p) => p.packageId === pkg.id);
              return (
                <li
                  key={pkg.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 px-3 py-2"
                >
                  <CheckboxChoice
                    className="min-h-[44px] min-w-[180px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                    checked={enabled}
                    onChange={(checked) => togglePackage(pkg.id, checked)}
                    label={pkg.name}
                    labelClassName="text-sm text-gray-200"
                  />
                  <span className="text-xs text-gray-500">
                    ${Number(pkg.packagePrice).toFixed(2)} · {pkg.itemSummary}
                  </span>
                  {enabled && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input max-w-[120px] ml-auto"
                      placeholder={t('monetization.giftCardOverridePrice')}
                      value={configured?.price ?? ''}
                      onChange={(e) => updatePackagePrice(pkg.id, e.target.value)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="font-medium text-gray-200">{t('monetization.giftCardPurchasableSubscriptions')}</h3>
        <p className="text-xs text-gray-500">{t('monetization.giftCardPurchasableSubscriptionsHint')}</p>
        {subscriptionPlans.length === 0 ? (
          <p className="text-sm text-gray-500">{t('monetization.giftCardNoSubscriptionPlans')}</p>
        ) : (
          <ul className="space-y-2">
            {subscriptionPlans.map((plan) => {
              const enabled = enabledPlanIds.has(plan.id);
              const configured = purchasableSubscriptionPlans.find((p) => p.planId === plan.id);
              return (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-800 px-3 py-2"
                >
                  <CheckboxChoice
                    className="min-h-[44px] min-w-[180px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                    checked={enabled}
                    onChange={(checked) => togglePlan(plan.id, checked)}
                    label={plan.name}
                    labelClassName="text-sm text-gray-200"
                  />
                  <span className="text-xs text-gray-500">
                    {plan.serviceName} · ${Number(plan.subscriptionPrice).toFixed(2)}
                  </span>
                  {enabled && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input max-w-[120px] ml-auto"
                      placeholder={t('monetization.giftCardOverridePrice')}
                      value={configured?.price ?? ''}
                      onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-200">{t('monetization.giftCardBundles')}</h3>
            <p className="text-xs text-gray-500 mt-1">{t('monetization.giftCardBundlesHint')}</p>
          </div>
          {!showBundleForm && (
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => setShowBundleForm(true)}>
              <Plus className="w-4 h-4" />
              {t('monetization.giftCardAddBundle')}
            </button>
          )}
        </div>

        {showBundleForm && (
          <div className="rounded-lg border border-gray-800 p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">{t('monetization.giftCardBundleName')}</label>
                <input
                  className="input"
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">{t('monetization.giftCardBundlePrice')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder={bundlePreviewTotal > 0 ? String(bundlePreviewTotal) : '0'}
                  value={bundleForm.price}
                  onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('monetization.giftCardBundleServices')}</label>
              <ul className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto sm:grid-cols-2">
                {services.map((svc) => {
                  const selected = bundleForm.selectedServiceIds.includes(svc.id);
                  return (
                    <li key={svc.id} className={selected ? 'sm:col-span-2' : undefined}>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <CheckboxChoice
                          className="min-h-[44px] flex-1 rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                          checked={selected}
                          onChange={(checked) => {
                            if (checked) {
                              setBundleForm({
                                ...bundleForm,
                                selectedServiceIds: [...bundleForm.selectedServiceIds, svc.id],
                                quantities: { ...bundleForm.quantities, [svc.id]: 1 },
                              });
                            } else {
                              setBundleForm({
                                ...bundleForm,
                                selectedServiceIds: bundleForm.selectedServiceIds.filter((id) => id !== svc.id),
                                quantities: Object.fromEntries(
                                  Object.entries(bundleForm.quantities).filter(([id]) => id !== svc.id),
                                ),
                              });
                            }
                          }}
                          label={`${svc.name} ($${Number(svc.price).toFixed(2)})`}
                          labelClassName="text-sm text-gray-200"
                        />
                        {selected && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500">{t('servicesPage.packagesQty')}</span>
                            <input
                              type="number"
                              min="1"
                              className="input max-w-[80px]"
                              value={bundleForm.quantities[svc.id] ?? 1}
                              onChange={(e) =>
                                setBundleForm({
                                  ...bundleForm,
                                  quantities: {
                                    ...bundleForm.quantities,
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
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={saveBundle}>
                {editingBundleId ? t('monetization.giftCardSaveBundle') : t('monetization.giftCardAddBundle')}
              </button>
              <button type="button" className="btn-secondary" onClick={resetBundleForm}>
                {t('monetization.giftCardCancelBundle')}
              </button>
            </div>
          </div>
        )}

        {bundles.length === 0 ? (
          <p className="text-sm text-gray-500">{t('monetization.giftCardNoBundles')}</p>
        ) : (
          <ul className="space-y-3">
            {bundles.map((bundle) => (
              <li key={bundle.id} className="rounded-lg border border-gray-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-200 inline-flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-400" />
                      {bundle.name}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      ${Number(bundle.price).toFixed(2)} ·{' '}
                      {bundle.lines.map((l) => `${l.serviceName} × ${l.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs text-blue-400 hover:underline" onClick={() => editBundle(bundle)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:underline inline-flex items-center gap-1"
                      onClick={() => removeBundle(bundle.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
