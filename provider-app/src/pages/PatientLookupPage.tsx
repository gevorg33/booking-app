import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';
import type { ProviderPatientSearchResponse } from '../lib/provider-patient-chart';

export default function PatientLookupPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const history = useHistory();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const searchEnabled = trimmedQuery.length >= 2;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['provider-patient-search', business?.id, trimmedQuery],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/patients/search`,
        { params: { q: trimmedQuery } },
      );
      return unwrap<ProviderPatientSearchResponse>(res);
    },
    enabled: !!business?.id && searchEnabled,
  });

  const patients = useMemo(() => data?.patients ?? [], [data?.patients]);

  if (data && !data.labFeaturesEnabled) {
    return (
      <ProviderTabPageShell embedded={embedded}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('provider.patientLookupTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ProviderTabScrollContent className="ion-padding">
          <p className="ion-text-center ion-padding">{t('clinic.labState.gate.disabledReason')}</p>
        </ProviderTabScrollContent>
      </ProviderTabPageShell>
    );
  }

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.patientLookupTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        <p className="booking-meta">{t('provider.patientLookupSubtitle')}</p>
        <IonSearchbar
          value={query}
          debounce={300}
          placeholder={t('provider.patientLookupPlaceholder')}
          onIonInput={(event) => setQuery(event.detail.value ?? '')}
        />

        {!searchEnabled ? (
          <p className="empty-state">{t('provider.patientLookupMinChars')}</p>
        ) : isLoading || isFetching ? (
          <div className="empty-state">
            <IonSpinner />
          </div>
        ) : !patients.length ? (
          <p className="empty-state">{t('provider.patientLookupEmpty')}</p>
        ) : (
          <IonList>
            {patients.map((patient) => (
              <IonItem
                key={patient.id}
                button
                detail
                onClick={() => history.push(`/tabs/patients/${patient.id}`)}
              >
                <IonLabel>
                  <h2>{patient.name}</h2>
                  {patient.phone && <p>{patient.phone}</p>}
                  {patient.email && <p className="booking-meta">{patient.email}</p>}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </ProviderTabScrollContent>
    </ProviderTabPageShell>
  );
}
