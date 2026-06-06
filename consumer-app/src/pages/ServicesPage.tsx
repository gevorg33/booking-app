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
import { useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import {
  formatInclusiveTaxBadge,
  shouldShowInclusiveTaxBadge,
} from '../lib/business-tax.js';
import { fetchPublicServices } from '../services/public-api.js';

export default function ServicesPage({
  slug,
  profile,
}: {
  slug: string;
  profile: PublicBusinessProfile;
}) {
  const history = useHistory();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', slug],
    queryFn: () => fetchPublicServices(slug),
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Services</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isLoading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : (
          <IonList>
            {services.map((service) => (
              <IonItem
                key={service.id}
                button
                detail
                onClick={() => history.push(buildSalonPath(slug, `/book/${service.id}`))}
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
            {services.length === 0 && (
              <p className="ion-padding">No services available at {profile.name}.</p>
            )}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
