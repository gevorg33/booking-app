import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import { ConsumerFixedActionBar } from '../components/ConsumerFixedActionBar.js';
import { ConsumerTourServiceCard } from '../components/ConsumerTourServiceCard.js';
import { ConsumerClinicServiceBadges } from '../components/ConsumerClinicServiceBadges.js';
import { track } from '../lib/app-analytics.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatCopy } from '../lib/copy.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import {
  formatInclusiveTaxBadge,
  shouldShowInclusiveTaxBadge,
} from '../lib/business-tax.js';
import { useQuery } from '@tanstack/react-query';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { useOnlineStatus } from '../lib/use-online-status.js';
import { fetchPublicPackages } from '../services/public-api.js';
import { isPublicTourService } from '../lib/tour-service.util.js';
import { groupServicesByCategory } from '../lib/provider-booking.util.js';
import {
  buildMultiServiceSchedulePath,
  getDisabledMultiServiceIds,
  persistMultiServiceCart,
  readPersistedMultiServiceCart,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
  validateLocalMultiServiceCart,
} from '../lib/multi-service-booking.js';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';

export default function ServicesPage({
  slug,
  profile,
  fromCache = false,
  copy,
  embedded = false,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  fromCache?: boolean;
  copy: ConsumerCopy;
  embedded?: boolean;
}) {
  const history = useHistory();
  const location = useLocation();
  const online = useOnlineStatus();
  const { data: services = [], isLoading, isFetching } = useCachedTenantServices(slug);
  const showCachedHint = fromCache || (!online && services.length > 0 && !isFetching);
  const multiEnabled = profile.multiService?.enabled === true;
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const packagesQuery = useQuery({
    queryKey: ['public-packages', slug],
    queryFn: () => fetchPublicPackages(slug),
    enabled: Boolean(slug && online),
  });
  const hasPackages = (packagesQuery.data?.length ?? 0) > 0;
  const showLegacyBookingEntry = services.length > 0 && !multiEnabled;
  const legacyBookingLabel = hasPackages ? copy.packagesTitle : copy.anySpecialist;
  const primary = profile.branding.primaryColor || '#7c3aed';
  const tourServices = useMemo(
    () => services.filter((service) => isPublicTourService(service)),
    [services],
  );
  const regularServices = useMemo(
    () => services.filter((service) => !isPublicTourService(service)),
    [services],
  );
  const groupedServices = useMemo(
    () => groupServicesByCategory(regularServices, copy.uncategorizedServices),
    [copy.uncategorizedServices, regularServices],
  );
  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds, services],
  );
  const cartTotals = useMemo(() => {
    if (selectedServiceIds.length < 2) return null;
    const turnover = profile.multiService?.turnoverBufferMinutes ?? 5;
    return {
      duration: sumMultiServiceDuration(selectedServices, turnover),
      price: sumMultiServicePrice(selectedServices),
      currency: resolveTenantPriceCurrency(selectedServices[0]?.currency, profile.currency),
    };
  }, [profile.currency, profile.multiService?.turnoverBufferMinutes, selectedServiceIds.length, selectedServices]);
  const disabledServiceIds = useMemo(() => {
    if (!multiEnabled || !profile.multiService || selectedServiceIds.length === 0) {
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
  }, [multiEnabled, profile.multiService, selectedServiceIds, services]);

  const cartErrors = useMemo(() => {
    if (!multiEnabled || !profile.multiService || selectedServiceIds.length < 2) return [];
    return validateLocalMultiServiceCart({
      services,
      selectedIds: selectedServiceIds,
      settings: profile.multiService,
    });
  }, [multiEnabled, profile.multiService, selectedServiceIds, services]);

  useEffect(() => {
    if (!multiEnabled || services.length === 0) return;
    const persisted = readPersistedMultiServiceCart(slug).filter((id) =>
      services.some((service) => service.id === id),
    );
    if (persisted.length > 0) setSelectedServiceIds(persisted);
  }, [multiEnabled, services, slug]);

  useEffect(() => {
    if (!multiEnabled) return;
    persistMultiServiceCart(slug, selectedServiceIds);
  }, [multiEnabled, selectedServiceIds, slug]);

  const toggleService = useCallback(
    (serviceId: string) => {
      setSelectedServiceIds((prev) => {
        if (prev.includes(serviceId)) return prev.filter((id) => id !== serviceId);
        if (disabledServiceIds.has(serviceId)) return prev;
        return [...prev, serviceId];
      });
    },
    [disabledServiceIds],
  );

  const onContinue = useCallback(() => {
    if (selectedServiceIds.length >= 2 && cartErrors.length === 0) {
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
      track('onboarding_step_viewed', {
        onboardingStep: 'service',
        serviceId: selectedServiceIds[0],
      });
      history.push(buildSalonPath(slug, `/book/${selectedServiceIds[0]}`));
    }
  }, [cartErrors.length, history, profile.multiService?.schedulingMode, selectedServiceIds, slug]);

  const hasMultiSelection = multiEnabled && selectedServiceIds.length >= 2;
  const hasSingleSelection = multiEnabled && selectedServiceIds.length === 1;
  const showContinueBar = multiEnabled && selectedServiceIds.length > 0;
  const continueDisabled = hasMultiSelection ? cartErrors.length > 0 : !hasSingleSelection;
  const continueLabel = hasMultiSelection
    ? copy.multiServiceContinue
    : hasSingleSelection
      ? copy.selectDateTime
      : copy.multiServiceContinue;

  const contentClassName = showContinueBar
    ? 'ion-padding consumer-tab-fixed-action-content'
    : 'ion-padding';

  return (
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Services</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className={contentClassName}>
          <BookingProgressIndicator pathname={location.pathname} />

          <IonButton
            expand="block"
            fill="outline"
            style={{
              marginBottom: 12,
              '--border-color': primary,
              '--color': primary,
            }}
            onClick={() => history.push(buildSalonPath(slug, '/professionals'))}
          >
            {copy.professionalsEntryCta}
          </IonButton>

          {showLegacyBookingEntry ? (
            <IonButton
              expand="block"
              fill="outline"
              style={{
                marginBottom: 16,
                '--border-color': primary,
                '--color': primary,
              }}
              onClick={() => history.push(buildSalonPath(slug, '/book/any'))}
            >
              {legacyBookingLabel}
            </IonButton>
          ) : null}

          {multiEnabled ? (
            <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.multiServiceSelectHint}</p>
          ) : null}

          {showCachedHint ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 12 }}>
              {copy.offlineCachedSalon}
            </p>
          ) : null}

          {isLoading && services.length === 0 ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner />
            </div>
          ) : services.length === 0 ? (
            <p style={{ color: '#6b7280' }}>{copy.offlineStatusOffline}</p>
          ) : (
            <>
              {tourServices.map((service) => (
                <ConsumerTourServiceCard
                  key={service.id}
                  service={service}
                  tenantCurrency={profile.currency}
                  selected={false}
                  primary={primary}
                  copy={copy}
                  onSelect={() => {
                    track('onboarding_step_viewed', {
                      onboardingStep: 'service',
                      serviceId: service.id,
                    });
                    history.push(buildSalonPath(slug, `/book/${service.id}`));
                  }}
                />
              ))}

              {hasMultiSelection && cartTotals ? (
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

              {groupedServices.map((group) => (
                <div key={group.key} style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{group.categoryName}</h2>
                  <IonList>
                    {group.services.map((service) => {
                      const checked = selectedServiceIds.includes(service.id);
                      const disabled = multiEnabled && disabledServiceIds.has(service.id) && !checked;

                      return (
                        <IonItem
                          key={service.id}
                          button
                          detail={!multiEnabled}
                          disabled={disabled}
                          onClick={() => {
                            if (multiEnabled) {
                              if (!disabled || checked) toggleService(service.id);
                              return;
                            }
                            track('onboarding_step_viewed', {
                              onboardingStep: 'service',
                              serviceId: service.id,
                            });
                            history.push(buildSalonPath(slug, `/book/${service.id}`));
                          }}
                        >
                          {multiEnabled ? (
                            <IonCheckbox
                              slot="start"
                              checked={checked}
                              disabled={disabled}
                              onIonChange={() => toggleService(service.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                          ) : null}
                          <IonLabel>
                            <h2>{service.name}</h2>
                            <ConsumerClinicServiceBadges service={service} copy={copy} />
                            <p>
                              {service.durationMinutes} min ·{' '}
                              {formatPublicMoney(service.price, service.currency, profile.currency)}
                              {shouldShowInclusiveTaxBadge(profile.tax) && profile.tax
                                ? ` · ${formatInclusiveTaxBadge(profile.tax)}`
                                : ''}
                            </p>
                            {service.description ? <p>{service.description}</p> : null}
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

      {showContinueBar ? (
        <ConsumerFixedActionBar
          label={continueLabel}
          disabled={continueDisabled}
          primaryColor={primary}
          onClick={onContinue}
        />
      ) : null}
    </ConsumerTabPageShell>
  );
}
