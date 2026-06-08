import {
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
import { useHistory, useLocation } from 'react-router-dom';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import { track } from '../lib/app-analytics.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import {
  formatInclusiveTaxBadge,
  shouldShowInclusiveTaxBadge,
} from '../lib/business-tax.js';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { useOnlineStatus } from '../lib/use-online-status.js';

export default function ServicesPage({
  slug,
  profile,
  fromCache = false,
  copy,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  fromCache?: boolean;
  copy: ConsumerCopy;
}) {
  const history = useHistory();
  const location = useLocation();
  const online = useOnlineStatus();
  const { data: services = [], isLoading, isFetching } = useCachedTenantServices(slug);
  const showCachedHint = fromCache || (!online && services.length > 0 && !isFetching);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Services</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <BookingProgressIndicator pathname={location.pathname} />

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
          <IonList>
            {services.map((service) => (
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
        )}
      </IonContent>
    </IonPage>
  );
}
