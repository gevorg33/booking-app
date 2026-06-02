'use client';

import { useMemo, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';

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

interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

interface GiftCardProductsPanelProps {
  services: ServiceOption[];
  purchasableServices: GiftCardPurchasableService[];
  bundles: GiftCardProductBundle[];
  onChange: (next: {
    purchasableServices: GiftCardPurchasableService[];
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
  purchasableServices,
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

  const toggleService = (serviceId: string, enabled: boolean) => {
    if (enabled) {
      const svc = services.find((s) => s.id === serviceId);
      onChange({
        purchasableServices: [...purchasableServices, { serviceId, price: svc?.price ?? null }],
        bundles,
      });
      return;
    }
    onChange({
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
    onChange({
      purchasableServices: purchasableServices.map((s) =>
        s.serviceId === serviceId
          ? { ...s, price: price.trim() === '' ? null : Number(price) }
          : s,
      ),
      bundles,
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

    onChange({ purchasableServices, bundles: nextBundles });
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
    onChange({
      purchasableServices,
      bundles: bundles.filter((b) => b.id !== bundleId),
    });
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
                  <label className="flex items-center gap-2 text-sm min-w-[180px]">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleService(svc.id, e.target.checked)}
                    />
                    <span>{svc.name}</span>
                  </label>
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {services.map((svc) => {
                  const selected = bundleForm.selectedServiceIds.includes(svc.id);
                  return (
                    <div key={svc.id} className="flex items-center gap-3 text-sm">
                      <label className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
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
                        />
                        {svc.name}
                      </label>
                      {selected && (
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
                      )}
                    </div>
                  );
                })}
              </div>
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
