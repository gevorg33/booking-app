import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { resolveLabBookingRequestNavigationPath } from '../lib/deep-link.js';

export default function LabRequestsPage({ slug }: { slug: string }) {
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    history.replace(
      resolveLabBookingRequestNavigationPath({
        slug,
        collectionServiceId: params.get('serviceId')?.trim() || undefined,
        clinicOrderToken: params.get('clinicOrderToken')?.trim() || undefined,
      }),
    );
  }, [history, location.search, slug]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <IonSpinner style={{ marginTop: '40vh' }} />
      </IonContent>
    </IonPage>
  );
}
