'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import {
  formatPrice,
  type PublicBusinessProfile,
  type PublicGiftCardCatalog,
  type PublicGiftCardType,
  type PublicService,
} from '@/lib/public-api';
import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface GiftCardCatalogClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  catalog: PublicGiftCardCatalog;
  services?: PublicService[];
}

export function GiftCardCatalogClient({ slug, tenant, catalog, services = [] }: GiftCardCatalogClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const businessCurrency = tenant.currency;
  const settings = catalog.settings!;
  const displayCurrency = (code?: string | null) =>
    resolveTenantPriceCurrency(code, businessCurrency);

  const availableTypes = useMemo(() => {
    const types: PublicGiftCardType[] = [];
    if (settings.presetAmounts.length > 0) types.push('monetary');
    if (settings.purchasableServices.length > 0) types.push('service');
    if (settings.bundles.length > 0) types.push('bundle');
    if ((settings.purchasablePackages ?? []).length > 0) types.push('package');
    if ((settings.purchasableSubscriptionPlans ?? []).length > 0) types.push('subscription');
    return types;
  }, [settings]);

  const [cardType, setCardType] = useState<PublicGiftCardType>(() => availableTypes[0] ?? 'monetary');
  const [amount, setAmount] = useState(String(settings.presetAmounts[0] ?? 50));
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    settings.purchasableServices[0]?.serviceId ? [settings.purchasableServices[0].serviceId] : [],
  );
  const [bundleId, setBundleId] = useState(settings.bundles[0]?.id ?? '');
  const [packageId, setPackageId] = useState(settings.purchasablePackages?.[0]?.packageId ?? '');
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(
    settings.purchasableSubscriptionPlans?.[0]?.planId ?? '',
  );

  const selectedBundle = useMemo(
    () => settings.bundles.find((b) => b.id === bundleId),
    [settings.bundles, bundleId],
  );

  const serviceNameById = useMemo(
    () => new Map(services.map((s) => [s.id, s.name])),
    [services],
  );

  const servicePriceById = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of settings.purchasableServices) {
      const catalogPrice = entry.price != null ? Number(entry.price) : null;
      const listPrice = services.find((service) => service.id === entry.serviceId)?.price;
      map.set(entry.serviceId, catalogPrice ?? Number(listPrice ?? 0));
    }
    return map;
  }, [services, settings.purchasableServices]);

  const selectedServicesTotal = useMemo(
    () => selectedServiceIds.reduce((sum, id) => sum + (servicePriceById.get(id) ?? 0), 0),
    [selectedServiceIds, servicePriceById],
  );

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  };

  const canContinue = useMemo(() => {
    if (cardType === 'monetary') return Number(amount) > 0;
    if (cardType === 'service') return selectedServiceIds.length > 0;
    if (cardType === 'package') return !!packageId;
    if (cardType === 'subscription') return !!subscriptionPlanId;
    return !!bundleId;
  }, [amount, bundleId, cardType, packageId, selectedServiceIds.length, subscriptionPlanId]);

  function onContinue() {
    const params = new URLSearchParams({ cardType });
    if (cardType === 'monetary') params.set('amount', amount);
    if (cardType === 'service') {
      if (selectedServiceIds.length === 1) {
        params.set('serviceId', selectedServiceIds[0]);
      } else {
        params.set('serviceIds', selectedServiceIds.join(','));
      }
    }
    if (cardType === 'bundle') params.set('bundleId', bundleId);
    if (cardType === 'package') params.set('packageId', packageId);
    if (cardType === 'subscription') params.set('subscriptionPlanId', subscriptionPlanId);
    router.push(`${bookPath(slug, '/gift-cards/checkout')}?${params.toString()}`);
  }

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={bookPath(slug)} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
            style={{ backgroundColor: primary }}
          >
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('public.giftCards.title')}</h1>
            <p className="text-sm text-gray-500">{t('public.giftCards.subtitle')}</p>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 p-5 mb-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">{t('public.giftCards.chooseType')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCardType(type)}
                className={`rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                  cardType === type
                    ? 'border-violet-400 bg-violet-50 text-violet-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t(`public.giftCards.type.${type}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {t(`public.giftCards.typeDescription.${cardType}`)}
          </p>

          {cardType === 'monetary' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">{t('public.giftCards.amountHint')}</p>
              <div className="flex flex-wrap gap-2">
                {settings.presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`rounded-full px-4 py-2 text-sm border ${
                      amount === String(preset)
                        ? 'border-violet-400 bg-violet-50 text-violet-800'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {formatPrice(preset, displayCurrency())}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          {cardType === 'service' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{t('public.giftCards.selectServicesHint')}</p>
              <ul className="space-y-2">
                {settings.purchasableServices.map((svc) => {
                  const selected = selectedServiceIds.includes(svc.serviceId);
                  const price = servicePriceById.get(svc.serviceId) ?? 0;
                  return (
                    <li key={svc.serviceId}>
                      <button
                        type="button"
                        onClick={() => toggleService(svc.serviceId)}
                        className={`w-full flex items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
                          selected
                            ? 'border-violet-400 ring-2 ring-violet-100'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {serviceNameById.get(svc.serviceId) ?? svc.serviceId}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(price, displayCurrency())}
                          </p>
                        </div>
                        <span
                          className="inline-block mt-1 w-5 h-5 rounded border-2 shrink-0"
                          style={{
                            borderColor: selected ? primary : '#d1d5db',
                            backgroundColor: selected ? primary : 'transparent',
                          }}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selectedServiceIds.length > 0 && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">
                    {t('public.giftCards.selectedServices', { count: selectedServiceIds.length })}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {formatPrice(selectedServicesTotal, displayCurrency())}
                  </p>
                </div>
              )}
            </div>
          )}

          {cardType === 'package' && (
            <div className="space-y-2">
              {(settings.purchasablePackages ?? []).map((pkg) => (
                <button
                  key={pkg.packageId}
                  type="button"
                  onClick={() => setPackageId(pkg.packageId)}
                  className={`w-full text-left rounded-xl border p-4 ${
                    packageId === pkg.packageId
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                      {t('public.giftCards.packageBadge')}
                    </span>
                    {(pkg.savingsPercent ?? 0) > 0 && (
                      <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                        {t('public.giftCards.packageSaveBadge', { percent: Math.round(pkg.savingsPercent ?? 0) })}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{pkg.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{pkg.itemSummary}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {formatPrice(pkg.packagePrice, displayCurrency(pkg.currency))}
                    {(pkg.regularTotal ?? 0) > pkg.packagePrice && (
                      <span className="text-gray-400 font-normal line-through ml-2">
                        {formatPrice(pkg.regularTotal ?? 0, displayCurrency(pkg.currency))}
                      </span>
                    )}
                  </p>
                </button>
              ))}
            </div>
          )}

          {cardType === 'subscription' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{t('public.giftCards.subscriptionPurchaseHint')}</p>
              {(settings.purchasableSubscriptionPlans ?? []).map((plan) => (
                <button
                  key={plan.planId}
                  type="button"
                  onClick={() => setSubscriptionPlanId(plan.planId)}
                  className={`w-full text-left rounded-xl border p-4 ${
                    subscriptionPlanId === plan.planId
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {t('public.giftCards.subscribeAndSaveBadge')}
                    </span>
                    {(plan.savingsPercent ?? 0) > 0 && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {t('public.giftCards.packageSaveBadge', { percent: Math.round(plan.savingsPercent ?? 0) })}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">
                    {plan.serviceName || plan.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.name} · {plan.includedAppointments}{' '}
                    {t('public.giftCards.subscriptionAppointments')} · {plan.durationMonths}{' '}
                    {t('public.giftCards.subscriptionMonths')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {formatPrice(plan.subscriptionPrice, displayCurrency(plan.currency))}
                    {(plan.regularTotal ?? 0) > plan.subscriptionPrice && (
                      <span className="text-gray-400 font-normal line-through ml-2">
                        {formatPrice(plan.regularTotal ?? 0, displayCurrency(plan.currency))}
                      </span>
                    )}
                  </p>
                  {(plan.savings ?? 0) > 0 && (
                    <p className="text-sm text-emerald-600 mt-1">
                      ({t('public.saveAmount', {
                        amount: formatPrice(plan.savings ?? 0, displayCurrency(plan.currency)),
                      })})
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {cardType === 'bundle' && (
            <div className="space-y-2">
              {settings.bundles.map((bundle) => (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => setBundleId(bundle.id)}
                  className={`w-full text-left rounded-xl border p-4 ${
                    bundleId === bundle.id
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{bundle.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {bundle.lines.map((l) => `${l.serviceName} × ${l.quantity}`).join(' · ')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {formatPrice(bundle.price, displayCurrency())}
                  </p>
                </button>
              ))}
              {selectedBundle && (
                <p className="text-xs text-gray-500">{t('public.giftCards.bundleSelected')}</p>
              )}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {t('public.giftCards.continueCheckout')}
          </button>
        </div>
      </div>
    </>
  );
}
