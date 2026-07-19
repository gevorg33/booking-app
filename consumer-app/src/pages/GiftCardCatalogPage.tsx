import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import {
  buildGiftCardCheckoutSearchParams,
  buildGiftCardServicePriceMap,
  canContinueGiftCardCatalog,
  resolveGiftCardAvailableTypes,
  resolveGiftCardCatalogGate,
  sumSelectedGiftCardServices,
} from '../lib/gift-card-catalog.util.js';
import { parseGiftCardAssistantPrefill } from '../lib/consumer-gift-card-assistant-prefill.util.js';
import {
  giftCardTypeDescription,
  giftCardTypeLabel,
  resolveGiftCardCatalogSubtitle,
} from '../lib/gift-card-copy.util.js';
import type { PublicGiftCardType } from '../lib/gift-card.types.js';
import { fetchPublicServices, getPublicGiftCardCatalog } from '../services/public-api.js';

export default function GiftCardCatalogPage() {
  const history = useHistory();
  const location = useLocation();
  const assistantPrefill = useMemo(
    () => parseGiftCardAssistantPrefill(new URLSearchParams(location.search)),
    [location.search],
  );
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });

  const catalogQuery = useQuery({
    queryKey: ['gift-card-catalog', slug],
    queryFn: () => getPublicGiftCardCatalog(slug!),
    enabled: Boolean(slug),
  });

  const servicesQuery = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => fetchPublicServices(slug!),
    enabled: Boolean(slug),
  });

  const settings = catalogQuery.data?.settings;
  const availableTypes = useMemo(
    () => (settings ? resolveGiftCardAvailableTypes(settings) : []),
    [settings],
  );

  const [cardType, setCardType] = useState<PublicGiftCardType>(() => availableTypes[0] ?? 'monetary');
  const [amount, setAmount] = useState(() => assistantPrefill.amount ?? String(settings?.presetAmounts[0] ?? 50));
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [bundleId, setBundleId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('');

  useEffect(() => {
    if (!settings) return;
    const types = resolveGiftCardAvailableTypes(settings);
    if (types.length && !types.includes(cardType)) {
      setCardType(types[0]);
    }
    if (!amount && settings.presetAmounts[0]) {
      setAmount(String(settings.presetAmounts[0]));
    }
    if (!bundleId && settings.bundles[0]) setBundleId(settings.bundles[0].id);
    if (!packageId && settings.purchasablePackages?.[0]) {
      setPackageId(settings.purchasablePackages[0].packageId);
    }
    if (!subscriptionPlanId && settings.purchasableSubscriptionPlans?.[0]) {
      setSubscriptionPlanId(settings.purchasableSubscriptionPlans[0].planId);
    }
    if (selectedServiceIds.length === 0 && settings.purchasableServices[0]) {
      setSelectedServiceIds([settings.purchasableServices[0].serviceId]);
    }
  }, [settings]);

  const servicePriceById = useMemo(
    () =>
      settings && servicesQuery.data
        ? buildGiftCardServicePriceMap(settings, servicesQuery.data)
        : new Map<string, number>(),
    [settings, servicesQuery.data],
  );

  const serviceNameById = useMemo(
    () => new Map((servicesQuery.data ?? []).map((service) => [service.id, service.name])),
    [servicesQuery.data],
  );

  const selectedServicesTotal = sumSelectedGiftCardServices(selectedServiceIds, servicePriceById);
  const canContinue = canContinueGiftCardCatalog({
    cardType,
    amount,
    selectedServiceIds,
    bundleId,
    packageId,
    subscriptionPlanId,
  });

  const primary = profile?.branding.primaryColor || '#7c3aed';
  const tenantCurrency = profile?.currency ?? 'USD';

  const onContinue = () => {
    if (!slug || !canContinue) return;
    const params = buildGiftCardCheckoutSearchParams({
      cardType,
      amount,
      selectedServiceIds,
      bundleId,
      packageId,
      subscriptionPlanId,
    });
    if (assistantPrefill.buyAsGift) params.set('buyAsGift', '1');
    if (assistantPrefill.recipientName) {
      params.set('recipientName', assistantPrefill.recipientName);
    }
    if (assistantPrefill.recipientEmail) {
      params.set('recipientEmail', assistantPrefill.recipientEmail);
    }
    if (assistantPrefill.deliveryMethod) {
      params.set('deliveryMethod', assistantPrefill.deliveryMethod);
    }
    history.push(`${buildSalonPath(slug, '/gift-cards/checkout')}?${params.toString()}`);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  };

  const catalogGate = resolveGiftCardCatalogGate({
    bootstrapLoading: loading,
    catalogLoading: catalogQuery.isLoading,
    bootstrapError: error,
    hasProfile: Boolean(profile),
    hasSlug: Boolean(slug),
    catalogFetchFailed: catalogQuery.isError,
    purchaseEnabled: catalogQuery.data?.purchaseEnabled,
    hasSettings: Boolean(settings),
  });

  if (catalogGate === 'loading') {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (catalogGate !== 'ready' || !settings || !slug || !profile) {
    const gateMessage =
      catalogGate === 'purchase_disabled'
        ? copy.giftCardPurchaseUnavailable
        : error || copy.networkLoadFailed;
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/')}  text={copy.guidePageBack} />
            </IonButtons>
            <IonTitle>{copy.giftCardNav}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{gateMessage}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.giftCardTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          {resolveGiftCardCatalogSubtitle(copy, Boolean(settings.physicalDeliveryEnabled))}
        </p>

        <section className="salon-card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{copy.giftCardChooseType}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableTypes.map((type) => (
              <IonButton
                key={type}
                size="small"
                fill={cardType === type ? 'solid' : 'outline'}
                onClick={() => setCardType(type)}
              >
                {giftCardTypeLabel(copy, type)}
              </IonButton>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12 }}>
            {giftCardTypeDescription(copy, cardType)}
          </p>

          {cardType === 'monetary' ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{copy.giftCardAmountHint}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {settings.presetAmounts.map((preset) => (
                  <IonButton
                    key={preset}
                    size="small"
                    fill={amount === String(preset) ? 'solid' : 'outline'}
                    onClick={() => setAmount(String(preset))}
                  >
                    {formatPublicMoney(preset, tenantCurrency, tenantCurrency)}
                  </IonButton>
                ))}
              </div>
              <IonInput
                type="number"
                value={amount}
                style={{ marginTop: 8, '--background': '#f9fafb' }}
                onIonInput={(e) => setAmount(String(e.detail.value ?? ''))}
              />
            </div>
          ) : null}

          {cardType === 'service' ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 14, color: '#6b7280' }}>{copy.giftCardSelectServicesHint}</p>
              {settings.purchasableServices.map((svc) => {
                const selected = selectedServiceIds.includes(svc.serviceId);
                const price = servicePriceById.get(svc.serviceId) ?? 0;
                return (
                  <button
                    key={svc.serviceId}
                    type="button"
                    onClick={() => toggleService(svc.serviceId)}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 12,
                      border: selected ? `2px solid ${primary}` : '1px solid #e5e7eb',
                      background: selected ? '#f5f3ff' : '#fff',
                    }}
                  >
                    <p style={{ fontWeight: 600 }}>{serviceNameById.get(svc.serviceId) ?? svc.serviceId}</p>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>
                      {formatPublicMoney(price, tenantCurrency, tenantCurrency)}
                    </p>
                  </button>
                );
              })}
              {selectedServiceIds.length > 0 ? (
                <p style={{ fontSize: 14, fontWeight: 600 }}>
                  {formatCopy(copy.giftCardSelectedServices, { count: String(selectedServiceIds.length) })}
                  {' · '}
                  {formatPublicMoney(selectedServicesTotal, tenantCurrency, tenantCurrency)}
                </p>
              ) : null}
            </div>
          ) : null}

          {cardType === 'bundle' ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settings.bundles.map((bundle) => (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => setBundleId(bundle.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border: bundleId === bundle.id ? `2px solid ${primary}` : '1px solid #e5e7eb',
                    background: bundleId === bundle.id ? '#f5f3ff' : '#fff',
                  }}
                >
                  <p style={{ fontWeight: 600 }}>{bundle.name}</p>
                  <p style={{ fontSize: 14, color: '#6b7280' }}>
                    {formatPublicMoney(bundle.price, tenantCurrency, tenantCurrency)}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          {cardType === 'package' ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(settings.purchasablePackages ?? []).map((pkg) => (
                <button
                  key={pkg.packageId}
                  type="button"
                  onClick={() => setPackageId(pkg.packageId)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border: packageId === pkg.packageId ? `2px solid ${primary}` : '1px solid #e5e7eb',
                    background: packageId === pkg.packageId ? '#f5f3ff' : '#fff',
                  }}
                >
                  <p style={{ fontWeight: 600 }}>{pkg.name}</p>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>{pkg.itemSummary}</p>
                  <p style={{ fontSize: 14, marginTop: 4 }}>
                    {formatPublicMoney(pkg.packagePrice, resolveTenantPriceCurrency(pkg.currency, tenantCurrency), tenantCurrency)}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          {cardType === 'subscription' ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(settings.purchasableSubscriptionPlans ?? []).map((plan) => (
                <button
                  key={plan.planId}
                  type="button"
                  onClick={() => setSubscriptionPlanId(plan.planId)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border:
                      subscriptionPlanId === plan.planId ? `2px solid ${primary}` : '1px solid #e5e7eb',
                    background: subscriptionPlanId === plan.planId ? '#f5f3ff' : '#fff',
                  }}
                >
                  <p style={{ fontWeight: 600 }}>{plan.serviceName || plan.name}</p>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>
                    {plan.includedAppointments} {copy.giftCardSubscriptionAppointments} · {plan.durationMonths}{' '}
                    {copy.giftCardSubscriptionMonths}
                  </p>
                  <p style={{ fontSize: 14, marginTop: 4 }}>
                    {formatPublicMoney(plan.subscriptionPrice, resolveTenantPriceCurrency(plan.currency, tenantCurrency), tenantCurrency)}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <IonButton expand="block" disabled={!canContinue} style={{ '--background': primary }} onClick={onContinue}>
          {copy.giftCardContinueCheckout}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
