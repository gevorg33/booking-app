import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { ConsumerProviderList } from '../components/ConsumerProviderList.js';
import {
  buildProfessionalServicesPath,
  buildProfessionalsPath,
} from '../lib/provider-booking.util.js';
import { fetchPublicProviders } from '../services/public-api.js';

export default function ProfessionalsPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [employeeId, setEmployeeId] = useState<string | null>(params.get('employeeId'));
  const [startTime, setStartTime] = useState<string | null>(params.get('startTime'));

  const providersQuery = useQuery({
    queryKey: ['public-providers', slug, locale],
    queryFn: () => fetchPublicProviders(slug!, { locale }),
    enabled: Boolean(slug),
  });

  const onSelect = useCallback(
    (empId: string, start: string) => {
      setEmployeeId(empId);
      setStartTime(start);
      history.replace(buildProfessionalsPath(slug!, { employeeId: empId, startTime: start }));
    },
    [history, slug],
  );

  const selectedProvider = providersQuery.data?.find((entry) => entry.id === employeeId);

  const onContinue = () => {
    if (!slug || !employeeId || !startTime) return;
    history.push(
      buildProfessionalServicesPath(slug, employeeId, startTime, {
        employeeName: selectedProvider?.name,
      }),
    );
  };

  if (loading || providersQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || 'Salon not found'}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug)} />
          </IonButtons>
          <IonTitle>{copy.chooseSpecialist}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.specialistAiHint}</p>

        <ConsumerProviderList
          slug={slug}
          providers={providersQuery.data ?? []}
          primaryColor={primary}
          copy={copy}
          locale={locale}
          selectedEmployeeId={employeeId}
          selectedStartTime={startTime}
          onSelect={onSelect}
          onAnySpecialist={() => history.push(buildSalonPath(slug, '/book/any'))}
        />

        <IonButton
          expand="block"
          disabled={!employeeId || !startTime}
          style={{ marginTop: 16, '--background': primary }}
          onClick={onContinue}
        >
          {copy.selectService}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
