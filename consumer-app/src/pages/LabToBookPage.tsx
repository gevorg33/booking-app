import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import type { PublicBusinessProfile } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatCopy } from '../lib/copy.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
} from '../lib/customer-auth.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import { fetchMyClinicLabBookingRequests } from '../services/public-api.js';
import { ConsumerMyLabBookingRequestsList } from '../components/ConsumerMyLabBookingRequestsList.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';

export default function LabToBookPage({
  slug,
  profile,
  embedded = false,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  embedded?: boolean;
}) {
  const history = useHistory();
  const token = getCustomerToken(slug);
  const customer = getStoredCustomerProfile(slug);
  const authed = !!token;
  const clinicEnabled = shouldShowPatientResultsTab(profile.businessType);
  const { locale, copy } = useConsumerCopy(slug, profile);

  const navigateToAlertSection = (route: ConsumerPatientAlertRoute, anchorId: string) => {
    const path = buildSalonPath(slug, route);
    if (window.location.pathname !== path) {
      history.push(path);
    }
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // e2e-bug.43 — never hit clinic APIs for non-clinic businesses (avoids 403 retry storm).
  const labBookingRequestsQuery = useQuery({
    queryKey: ['clinic-lab-booking-requests', slug],
    queryFn: () => fetchMyClinicLabBookingRequests(slug),
    enabled: clinicEnabled && authed,
  });

  return (
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{copy.myLabToBookTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!authed ? (
          <>
            <p>{formatCopy(copy.myLabToBookSignInPrompt, { name: profile.name })}</p>
            <IonButton expand="block" onClick={() => history.push(buildSalonPath(slug, '/login'))}>
              {copy.signInWithGoogle}
            </IonButton>
          </>
        ) : (
          <>
            {customer?.name ? (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 16 }}>
                {customer.name}
              </p>
            ) : null}
            <ConsumerPatientAlertsBanner
              slug={slug}
              copy={copy}
              businessType={profile.businessType}
              onNavigate={navigateToAlertSection}
            />
            <div id="my-lab-requests">
              <ConsumerMyLabBookingRequestsList
                slug={slug}
                requests={labBookingRequestsQuery.data ?? []}
                loading={labBookingRequestsQuery.isLoading}
                error={
                  labBookingRequestsQuery.isError
                    ? formatFriendlyNetworkError(
                        labBookingRequestsQuery.error,
                        copy.myLabToBookLoadFailed,
                      )
                    : null
                }
                locale={locale}
              />
            </div>
          </>
        )}
      </IonContent>
    </ConsumerTabPageShell>
  );
}
