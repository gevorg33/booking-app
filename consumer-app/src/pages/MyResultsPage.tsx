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
import {
  fetchMyClinicTestResults,
  fetchMyClinicDocuments,
} from '../services/public-api.js';
import { ConsumerMyResultsList } from '../components/ConsumerMyResultsList.js';
import { ConsumerMyDocumentsList } from '../components/ConsumerMyDocumentsList.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';

export default function MyResultsPage({
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
  const resultsQuery = useQuery({
    queryKey: ['clinic-results', slug],
    queryFn: () => fetchMyClinicTestResults(slug),
    enabled: clinicEnabled && authed,
  });

  const documentsQuery = useQuery({
    queryKey: ['clinic-documents', slug],
    queryFn: () => fetchMyClinicDocuments(slug),
    enabled: clinicEnabled && authed,
  });

  return (
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{copy.myResultsTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!authed ? (
          <>
            <p>{formatCopy(copy.myResultsSignInPrompt, { name: profile.name })}</p>
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
            <div id="my-intake" />
            <ConsumerPatientAlertsBanner
              slug={slug}
              copy={copy}
              businessType={profile.businessType}
              onNavigate={navigateToAlertSection}
            />
            <h2 id="my-results" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>
              {copy.myResultsTitle}
            </h2>
            <ConsumerMyResultsList
              results={resultsQuery.data ?? []}
              loading={resultsQuery.isLoading}
              error={
                resultsQuery.isError
                  ? formatFriendlyNetworkError(
                      resultsQuery.error,
                      copy.myResultsLoadFailed,
                    )
                  : null
              }
              locale={locale}
            />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 24, marginBottom: 12 }}>
              {copy.myDocumentsTitle}
            </h2>
            <ConsumerMyDocumentsList
              documents={documentsQuery.data ?? []}
              loading={documentsQuery.isLoading}
              error={
                documentsQuery.isError
                  ? formatFriendlyNetworkError(
                      documentsQuery.error,
                      copy.myDocumentsLoadFailed,
                    )
                  : null
              }
              locale={locale}
            />
          </>
        )}
      </IonContent>
    </ConsumerTabPageShell>
  );
}
