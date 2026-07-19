import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonDatetime,
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
import { ConsumerGroupedTimeSlotList } from '../components/ConsumerGroupedTimeSlotList.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { useServiceBookableDates } from '../hooks/use-service-bookable-dates.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatScheduleTime } from '../lib/date-format.js';
import { buildAutoAssignBookPath } from '../lib/provider-booking.util.js';
import { isDayLevelTourService } from '../lib/tour-service.util.js';
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
  const isDayLevelTour = service ? isDayLevelTourService(service) : false;

  const { scanning: bookableDatesScanning, isDateEnabled } = useServiceBookableDates({
    slug: slug ?? undefined,
    serviceId,
    enabled: Boolean(slug && serviceId),
    isDayLevelTour,
    minDateKey: minDate,
  });

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
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/book/any')}  text={copy.guidePageBack} />
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
            <IonBackButton defaultHref={buildSalonPath(slug, '/book/any')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.selectDateTime}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{service.name}</p>

        <IonItem lines="none">
          <IonLabel position="stacked">{copy.availableSlots}</IonLabel>
          <IonDatetime
            className="consumer-booking-datetime"
            presentation="date"
            min={minDate}
            value={date}
            isDateEnabled={isDateEnabled}
            onIonChange={(e) => {
              const value = e.detail.value;
              if (typeof value !== 'string') return;
              if (!isDateEnabled(value)) return;
              setDate(value.slice(0, 10));
              setSelectedStartTime(null);
            }}
          />
          {bookableDatesScanning ? <IonSpinner name="crescent" slot="end" /> : null}
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
        ) : (
          <ConsumerGroupedTimeSlotList
            slots={slots}
            selectedStartTime={selectedStartTime}
            onSelect={setSelectedStartTime}
            copy={copy}
            primaryColor={primary}
            formatSlotLabel={(startTime) => formatScheduleTime(startTime, locale)}
          />
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
