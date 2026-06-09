import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import { ConsumerTourServiceCard } from '../components/ConsumerTourServiceCard.js';
import { ConsumerClinicServiceBadges } from '../components/ConsumerClinicServiceBadges.js';
import { track } from '../lib/app-analytics.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import {
  formatInclusiveTaxBadge,
  shouldShowInclusiveTaxBadge,
} from '../lib/business-tax.js';
import { useQuery } from '@tanstack/react-query';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { useOnlineStatus } from '../lib/use-online-status.js';
import { fetchPublicPackages } from '../services/public-api.js';
import { isPublicTourService } from '../lib/tour-service.util.js';
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
  const packagesQuery = useQuery({
    queryKey: ['public-packages', slug],
    queryFn: () => fetchPublicPackages(slug),
    enabled: Boolean(slug && online),
  });
  const hasPackages = (packagesQuery.data?.length ?? 0) > 0;
  const showAnyBookingEntry = services.length > 0;
  const anyBookingLabel = multiEnabled
    ? copy.multiServiceEntryCta
    : hasPackages
      ? copy.packagesTitle
      : copy.anySpecialist;
  const primary = profile.branding.primaryColor || '#7c3aed';

  return (
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Services</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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

        {showAnyBookingEntry ? (
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
            {anyBookingLabel}
          </IonButton>
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
            {services.map((service) =>
              isPublicTourService(service) ? (
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
              ) : null,
            )}
            <IonList>
              {services
                .filter((service) => !isPublicTourService(service))
                .map((service) => (
                  <IonItem
                    key={service.id}
                    button
                    detail
                    onClick={() => {
                      track('onboarding_step_viewed', {
                        onboardingStep: 'service',
                        serviceId: service.id,
                      });
                      history.push(buildSalonPath(slug, `/book/${service.id}`));
                    }}
                  >
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
                ))}
            </IonList>
          </>
        )}
      </IonContent>
    </ConsumerTabPageShell>
  );
}
