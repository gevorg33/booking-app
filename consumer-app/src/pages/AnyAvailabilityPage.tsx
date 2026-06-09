import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ConsumerFixedActionBar } from '../components/ConsumerFixedActionBar.js';
import { ConsumerNetworkErrorCard } from '../components/ConsumerNetworkErrorCard.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatScheduleTime } from '../lib/date-format.js';
import { buildAutoAssignBookPath } from '../lib/provider-booking.util.js';
import { fetchServiceDaySlots } from '../services/public-api.js';

export default function AnyAvailabilityPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const serviceId = params.get('serviceId')?.trim() ?? '';
  const clinicOrderToken = params.get('clinicOrderToken')?.trim() || undefined;

  const { data: services = [], isLoading: servicesLoading } = useCachedTenantServices(slug ?? '');
  const service = services.find((entry) => entry.id === serviceId);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(minDate);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);

  const slotsQuery = useQuery({
    queryKey: ['any-availability-slots', slug, serviceId, date],
    queryFn: () => fetchServiceDaySlots(slug!, serviceId, date),
    enabled: Boolean(slug && serviceId && date),
  });

  const slots = slotsQuery.data?.slots ?? [];

  const onContinue = useCallback(() => {
    if (!slug || !serviceId || !selectedStartTime) return;
    history.push(
      buildAutoAssignBookPath(slug, serviceId, selectedStartTime, clinicOrderToken),
    );
  }, [clinicOrderToken, history, selectedStartTime, serviceId, slug]);

  if (loading || servicesLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !serviceId || !service) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/book/any')} />
            </IonButtons>
            <IonTitle>{copy.selectDateTime}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || copy.noServicesForSlot}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';

  return (
    <IonPage className="consumer-page-with-fixed-action">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/book/any')} />
          </IonButtons>
          <IonTitle>{copy.selectDateTime}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{service.name}</p>

        <IonItem lines="none">
          <IonLabel position="stacked">{copy.availableSlots}</IonLabel>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedStartTime(null);
            }}
            style={{
              width: '100%',
              padding: '10px 0',
              border: 'none',
              background: 'transparent',
              fontSize: 16,
            }}
          />
        </IonItem>

        {slotsQuery.isLoading ? (
          <IonSpinner className="ion-margin-top" />
        ) : slotsQuery.isError ? (
          <ConsumerNetworkErrorCard
            compact
            message={copy.networkLoadFailed}
            retryLabel={copy.networkRetryAction}
            onRetry={() => void slotsQuery.refetch()}
          />
        ) : slots.length === 0 ? (
          <p className="ion-padding">{copy.noSlotsThisDay}</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {slots.map((slot) => {
              const active = selectedStartTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedStartTime(slot.startTime)}
                  style={{
                    borderRadius: 999,
                    border: active ? 'none' : '1px solid #e5e7eb',
                    background: active ? primary : '#f9fafb',
                    color: active ? '#fff' : '#374151',
                    padding: '8px 14px',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {formatScheduleTime(slot.startTime, locale)}
                </button>
              );
            })}
          </div>
        )}
      </IonContent>

      <ConsumerFixedActionBar
        label={copy.bookAppointment}
        disabled={!selectedStartTime}
        primaryColor={primary}
        onClick={onContinue}
      />
    </IonPage>
  );
}
