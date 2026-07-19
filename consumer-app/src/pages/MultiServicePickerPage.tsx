import {
  IonBackButton,
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
import { ConsumerAiShell } from '../components/ConsumerAiShell.js';
import { ConsumerFixedActionBar } from '../components/ConsumerFixedActionBar.js';
import { ConsumerPackageCards } from '../components/ConsumerPackageCards.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatCopy } from '../lib/copy.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import { buildPackageConfirmPath } from '../lib/package-booking.js';
import { buildAnyAvailabilityPath } from '../lib/provider-booking.util.js';
import {
  buildMultiServiceSchedulePath,
  getDisabledMultiServiceIds,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
  validateLocalMultiServiceCart,
} from '../lib/multi-service-booking.js';
import { resolveBlockedMultiServiceAddReason } from '../lib/multi-service-selection-feedback.util.js';
import type { PublicService } from '../lib/types.js';
import {
  fetchPublicPackages,
  fetchPublicServices,
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
  const [selectionBlockMessage, setSelectionBlockMessage] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

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
  const pageAvailable = services.length > 0 || packages.length > 0;

  useEffect(() => {
    if (!slug || !multiEnabled || services.length === 0) return;
    // e2e-bug.177 — this page stays mounted in Ionic's IonRouterOutlet stack (no <Switch>)
    // for the rest of the session once visited; useLocation() is global, so without this
    // guard this effect kept firing on every later unrelated navigation and stomping on it
    // with a stale redirect back to /book/any.
    if (!location.pathname.endsWith('/book/any')) return;
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
  }, [history, location.pathname, location.search, multiEnabled, services, slug]);

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
        maxServiceCount: profile.multiService.maxServiceCount,
        maxDurationMinutes: profile.multiService.maxDurationMinutes,
        turnoverBufferMinutes: profile.multiService.turnoverBufferMinutes ?? 5,
      },
    });
  }, [multiEnabled, profile?.multiService, selectedServiceIds, services]);

  const cartErrors = useMemo(() => {
    if (!multiEnabled || !profile?.multiService || selectedServiceIds.length < 2) return [];
    return validateLocalMultiServiceCart({
      services,
      selectedIds: selectedServiceIds,
      settings: profile.multiService,
    });
  }, [multiEnabled, profile?.multiService, selectedServiceIds, services]);

  const groupedServices = useMemo(
    () => groupServicesByCategory(services, copy.uncategorizedServices),
    [copy.uncategorizedServices, services],
  );

  const multiSettings = profile?.multiService
    ? {
        incompatiblePairMode: profile.multiService.incompatiblePairMode ?? 'service',
        incompatiblePairs: profile.multiService.incompatiblePairs ?? [],
        incompatibleCategoryPairs: profile.multiService.incompatibleCategoryPairs ?? [],
        maxServiceCount: profile.multiService.maxServiceCount,
        maxDurationMinutes: profile.multiService.maxDurationMinutes,
        turnoverBufferMinutes: profile.multiService.turnoverBufferMinutes ?? 5,
      }
    : null;

  const toggleService = (id: string) => {
    setSelectedPackageId(null);
    if (multiEnabled) {
      setServiceId(null);
      if (selectedServiceIds.includes(id)) {
        setSelectionBlockMessage('');
        setSelectedServiceIds((prev) => prev.filter((entry) => entry !== id));
        return;
      }
      if (disabledServiceIds.has(id) && multiSettings) {
        const reason = resolveBlockedMultiServiceAddReason({
          serviceId: id,
          selectedIds: selectedServiceIds,
          services,
          settings: multiSettings,
        });
        if (reason === 'max_count') {
          setSelectionBlockMessage(
            formatCopy(copy.multiServiceMaxCountBlocked, {
              count: multiSettings.maxServiceCount,
            }),
          );
        } else if (reason === 'duration') {
          setSelectionBlockMessage(
            formatCopy(copy.multiServiceDurationBlocked, {
              limit: multiSettings.maxDurationMinutes,
            }),
          );
        } else if (reason === 'incompatible') {
          setSelectionBlockMessage(copy.multiServiceIncompatibleBlocked);
        }
        return;
      }
      setSelectionBlockMessage('');
      setSelectedServiceIds((prev) => [...prev, id]);
      return;
    }
    setSelectedServiceIds([]);
    setServiceId((prev) => (prev === id ? null : id));
  };

  const onSelectPackage = (packageId: string) => {
    setSelectedPackageId((prev) => (prev === packageId ? null : packageId));
    setSelectedServiceIds([]);
    setServiceId(null);
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
    const singleServiceId =
      serviceId ?? (multiEnabled && selectedServiceIds.length === 1 ? selectedServiceIds[0] : null);
    if (singleServiceId) {
      history.push(buildAnyAvailabilityPath(slug, singleServiceId));
    }
  }, [cartErrors.length, history, multiEnabled, profile, selectedPackageId, selectedServiceIds, serviceId, slug]);

  const hasSingleSelection =
    Boolean(serviceId) || (multiEnabled && selectedServiceIds.length === 1);
  const hasMultiSelection = multiEnabled && selectedServiceIds.length >= 2;

  const continueDisabled =
    !selectedPackageId &&
    ((!hasSingleSelection && !hasMultiSelection) ||
      (hasMultiSelection && cartErrors.length > 0));

  const continueLabel = selectedPackageId
    ? copy.schedulePackage
    : hasMultiSelection
      ? copy.multiServiceContinue
      : hasSingleSelection
        ? copy.selectDateTime
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
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/services')}  text={copy.guidePageBack} />
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
    <ConsumerAiShell slug={slug} profile={profile} copy={copy} locale={locale}>
    <IonPage className="consumer-page-with-fixed-action">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/services')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>
            {multiEnabled ? copy.multiServiceEntryCta : packages.length > 0 ? copy.packagesTitle : copy.anySpecialist}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {multiEnabled ? (
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.multiServiceSelectHint}</p>
        ) : (
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.anySpecialistHint}</p>
        )}

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
                {cartErrors.map((error) => (
                  <p key={error} role="alert" style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 14 }}>
                    {error}
                  </p>
                ))}
              </div>
            ) : null}

            {selectionBlockMessage ? (
              <p role="alert" style={{ margin: '0 0 12px', color: '#b91c1c', fontSize: 14 }}>
                {selectionBlockMessage}
              </p>
            ) : null}

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{copy.servicesSection}</h2>

            {groupedServices.map((group) => (
              <div key={group.key} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, color: '#6b7280', textTransform: 'uppercase' }}>
                  {group.categoryName}
                </h3>
                <IonList>
                  {group.services.map((service) => {
                    const checked = multiEnabled
                      ? selectedServiceIds.includes(service.id)
                      : serviceId === service.id;
                    const blocked = multiEnabled && disabledServiceIds.has(service.id) && !checked;
                    return (
                      <IonItem
                        key={service.id}
                        button
                        color={!multiEnabled && checked ? 'primary' : undefined}
                        disabled={false}
                        style={blocked ? { opacity: 0.55 } : undefined}
                        onClick={() => toggleService(service.id)}
                      >
                        {multiEnabled ? (
                          <IonCheckbox
                            slot="start"
                            checked={checked}
                            disabled={blocked}
                            onIonChange={() => toggleService(service.id)}
                          />
                        ) : null}
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

      </IonContent>
      <ConsumerFixedActionBar
        label={continueLabel}
        disabled={continueDisabled}
        primaryColor={primary}
        onClick={onContinue}
      />
    </IonPage>
    </ConsumerAiShell>
  );
}
