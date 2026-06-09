import { IonContent, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';
import { resolveLabBookingRequestNavigationPath } from '../lib/deep-link.js';

export default function LabRequestsPage({
  slug,
  embedded = false,
}: {
  slug: string;
  embedded?: boolean;
}) {
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
    <ConsumerTabPageShell embedded={embedded}>
      <IonContent className="ion-padding ion-text-center">
        <IonSpinner style={{ marginTop: '40vh' }} />
      </IonContent>
    </ConsumerTabPageShell>
  );
}
