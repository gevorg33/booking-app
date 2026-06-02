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
import { fetchPublicServices } from '../services/public-api.js';

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

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
                    {service.durationMinutes} min · {formatPrice(service.price, service.currency)}
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
