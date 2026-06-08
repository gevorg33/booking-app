import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ConsumerPackageCards } from '../components/ConsumerPackageCards.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatCopy } from '../lib/copy.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import { buildPackageConfirmPath } from '../lib/package-booking.js';
import {
  buildMultiServiceSchedulePath,
  getDisabledMultiServiceIds,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
} from '../lib/multi-service-booking.js';
import type { PublicService } from '../lib/types.js';
import {
  fetchPublicPackages,
  fetchPublicServices,
  previewPublicMultiService,
} from '../services/public-api.js';

function groupServicesByCategory(services: PublicService[], uncategorizedLabel: string) {
  const groups = new Map<
    string,
    { key: string; categoryName: string; sortOrder: number; services: PublicService[] }
  >();
  for (const service of services) {
    const key = service.category?.id ?? '__uncategorized__';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        categoryName: service.category?.name ?? uncategorizedLabel,
        sortOrder: service.category?.sortOrder ?? 9999,
        services: [],
      });
    }
    groups.get(key)!.services.push(service);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

export default function MultiServicePickerPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [cartErrors, setCartErrors] = useState<string[]>([]);

  const servicesQuery = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => fetchPublicServices(slug!),
    enabled: Boolean(slug),
  });

  const packagesQuery = useQuery({
    queryKey: ['public-packages', slug],
    queryFn: () => fetchPublicPackages(slug!),
    enabled: Boolean(slug),
  });

  const services = servicesQuery.data ?? [];
  const packages = packagesQuery.data ?? [];
  const multiEnabled = profile?.multiService?.enabled === true;
  const pageAvailable = multiEnabled || packages.length > 0;

  useEffect(() => {
    if (!slug || !multiEnabled || services.length === 0) return;
    const params = new URLSearchParams(location.search);
    const ids = resolveMultiServiceCartFromLocation(slug, params.get('services'), services);
    if (ids.length === 0) return;
    setSelectedServiceIds(ids);
    setSelectedPackageId(null);
    persistMultiServiceCart(slug, ids);
    if (!params.get('services')) {
      const q = new URLSearchParams({ services: ids.join(',') });
      history.replace(`${buildSalonPath(slug, '/book/any')}?${q.toString()}`);
    }
  }, [history, location.search, multiEnabled, services, slug]);

  useEffect(() => {
    if (slug) persistMultiServiceCart(slug, selectedServiceIds);
  }, [selectedServiceIds, slug]);

  const selectedServices = useMemo(
    () => services.filter((svc) => selectedServiceIds.includes(svc.id)),
    [selectedServiceIds, services],
  );

  const cartTotals = useMemo(() => {
    if (selectedServiceIds.length < 2 || !profile) return null;
    const turnover = profile.multiService?.turnoverBufferMinutes ?? 5;
    return {
      duration: sumMultiServiceDuration(selectedServices, turnover),
      price: sumMultiServicePrice(selectedServices),
      currency: resolveTenantPriceCurrency(selectedServices[0]?.currency, profile.currency),
    };
  }, [profile, selectedServiceIds.length, selectedServices]);

  const disabledServiceIds = useMemo(() => {
    if (!multiEnabled || !profile?.multiService || selectedServiceIds.length === 0) {
      return new Set<string>();
    }
    return getDisabledMultiServiceIds({
      services,
      selectedIds: selectedServiceIds,
      settings: {
        incompatiblePairMode: profile.multiService.incompatiblePairMode ?? 'service',
        incompatiblePairs: profile.multiService.incompatiblePairs ?? [],
        incompatibleCategoryPairs: profile.multiService.incompatibleCategoryPairs ?? [],
      },
    });
  }, [multiEnabled, profile?.multiService, selectedServiceIds, services]);

  useEffect(() => {
    if (!slug || !multiEnabled || selectedServiceIds.length < 2) {
      setCartErrors([]);
      return;
    }
    void previewPublicMultiService(slug, selectedServiceIds)
      .then((preview) => setCartErrors(preview.valid ? [] : preview.errors))
      .catch((err: unknown) =>
        setCartErrors([(err as Error)?.message || copy.validateServiceSelectionFailed]),
      );
  }, [copy.validateServiceSelectionFailed, multiEnabled, selectedServiceIds, slug]);

  const groupedServices = useMemo(
    () => groupServicesByCategory(services, copy.uncategorizedServices),
    [copy.uncategorizedServices, services],
  );

  const toggleService = (id: string) => {
    setSelectedPackageId(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const onSelectPackage = (packageId: string) => {
    setSelectedPackageId((prev) => (prev === packageId ? null : packageId));
    setSelectedServiceIds([]);
    setCartErrors([]);
  };

  const onContinue = useCallback(() => {
    if (!slug || !profile) return;
    if (selectedPackageId) {
      history.push(buildPackageConfirmPath(slug, selectedPackageId));
      return;
    }
    if (multiEnabled && selectedServiceIds.length >= 2 && cartErrors.length === 0) {
      history.push(
        buildMultiServiceSchedulePath(
          slug,
          uniqueMultiServiceIds(selectedServiceIds),
          profile.multiService?.schedulingMode ?? 'same_visit',
        ),
      );
      return;
    }
    if (selectedServiceIds.length === 1) {
      history.push(buildSalonPath(slug, `/book/${selectedServiceIds[0]}`));
    }
  }, [cartErrors.length, history, multiEnabled, profile, selectedPackageId, selectedServiceIds, slug]);

  const continueDisabled =
    !selectedPackageId &&
    (selectedServiceIds.length === 0 ||
      (selectedServiceIds.length >= 2 && cartErrors.length > 0) ||
      (selectedServiceIds.length === 1 && !multiEnabled && packages.length === 0));

  const continueLabel = selectedPackageId
    ? copy.schedulePackage
    : selectedServiceIds.length >= 2
      ? copy.multiServiceContinue
      : selectedServiceIds.length === 1
        ? copy.assistantContinueBooking
        : copy.multiServiceContinue;

  if (loading || servicesQuery.isLoading || packagesQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !pageAvailable) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/services')} />
            </IonButtons>
            <IonTitle>{copy.servicesSection}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'Booking is not available for this salon.'}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
          </IonButtons>
          <IonTitle>{multiEnabled ? copy.multiServiceEntryCta : copy.packagesTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {multiEnabled ? (
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.multiServiceSelectHint}</p>
        ) : null}

        <ConsumerPackageCards
          packages={packages}
          businessCurrency={profile.currency}
          primaryColor={primary}
          selectedPackageId={selectedPackageId}
          onSelect={onSelectPackage}
          copy={copy}
          locale={locale}
        />

        {selectedPackageId ? null : (
          <>
            {selectedServiceIds.length >= 2 && cartTotals ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  background: `${primary}14`,
                  border: `1px solid ${primary}33`,
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {formatCopy(copy.multiServiceCart, { count: selectedServiceIds.length })}
                </p>
                <p style={{ margin: '4px 0 0', color: '#4b5563' }}>
                  {formatCopy(copy.multiServiceTotal, {
                    duration: cartTotals.duration,
                    price: formatPublicMoney(cartTotals.price, cartTotals.currency, profile.currency),
                  })}
                </p>
              </div>
            ) : null}

            {cartErrors.map((entry) => (
              <p key={entry} style={{ color: '#b91c1c', fontSize: 14 }}>
                {entry}
              </p>
            ))}

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{copy.servicesSection}</h2>

            {groupedServices.map((group) => (
              <div key={group.key} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, color: '#6b7280', textTransform: 'uppercase' }}>
                  {group.categoryName}
                </h3>
                <IonList>
                  {group.services.map((service) => {
                    const checked = selectedServiceIds.includes(service.id);
                    const disabled = disabledServiceIds.has(service.id);
                    return (
                      <IonItem key={service.id} disabled={disabled && !checked}>
                        <IonCheckbox
                          slot="start"
                          checked={checked}
                          disabled={disabled && !checked}
                          onIonChange={() => toggleService(service.id)}
                        />
                        <IonLabel>
                          <h2>{service.name}</h2>
                          <p>
                            {service.durationMinutes} min ·{' '}
                            {formatPublicMoney(service.price, service.currency, profile.currency)}
                          </p>
                        </IonLabel>
                      </IonItem>
                    );
                  })}
                </IonList>
              </div>
            ))}
          </>
        )}

        <IonButton
          expand="block"
          disabled={continueDisabled}
          style={{ marginTop: 8, '--background': primary }}
          onClick={onContinue}
        >
          {continueLabel}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
