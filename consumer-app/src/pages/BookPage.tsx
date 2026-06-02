import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import {
  createBooking,
  fetchPublicProviders,
  fetchPublicServices,
  fetchServiceSlots,
} from '../services/public-api.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
  setCustomerSession,
} from '../lib/customer-auth.js';
import { buildSalonPath } from '../lib/deep-link.js';

export default function BookPage() {
  const { serviceId } = useParams<{ slug: string; serviceId: string }>();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState('');
  const [slot, setSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['services', slug],
    queryFn: () => fetchPublicServices(slug!),
    enabled: !!slug,
  });
  const service = services.find((s) => s.id === serviceId);

  const { data: providers = [] } = useQuery({
    queryKey: ['providers', slug],
    queryFn: () => fetchPublicProviders(slug!),
    enabled: !!slug,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', slug, serviceId, date],
    queryFn: () => fetchServiceSlots(slug!, serviceId!, date),
    enabled: !!slug && !!serviceId && !!date,
  });

  const profileStored = slug ? getStoredCustomerProfile(slug) : null;
  const authed = slug ? !!getCustomerToken(slug) : false;

  const minDate = useMemo(() => new Date().toISOString(), []);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !service) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={slug ? buildSalonPath(slug, '/services') : '/'} />
            </IonButtons>
            <IonTitle>Book</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'Service not found'}</p>
        </IonContent>
      </IonPage>
    );
  }

  const submit = async () => {
    if (!slug || !slot) return;
    const customer = profileStored;
    if (!customer?.name) {
      setMessage('Sign in from Account to book with your profile.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const result = await createBooking(slug, {
        serviceId: service.id,
        employeeId: employeeId || providers[0]?.id || '',
        startTime: slot,
        customer: {
          name: customer.name,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
        },
      });
      if (result.customer) {
        const token = getCustomerToken(slug);
        setCustomerSession(slug, token, result.customer);
      }
      void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
      setMessage('Booking confirmed!');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
          </IonButtons>
          <IonTitle>{service.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem lines="none">
          <IonLabel position="stacked">Date</IonLabel>
          <IonDatetime
            presentation="date"
            min={minDate}
            value={date}
            onIonChange={(e) => {
              const v = e.detail.value;
              if (typeof v === 'string') setDate(v.slice(0, 10));
            }}
          />
        </IonItem>

        {providers.length > 0 && (
          <IonItem>
            <IonLabel>Specialist</IonLabel>
            <IonSelect
              value={employeeId}
              placeholder="Any available"
              onIonChange={(e) => setEmployeeId(String(e.detail.value ?? ''))}
            >
              <IonSelectOption value="">Any available</IonSelectOption>
              {providers.map((p) => (
                <IonSelectOption key={p.id} value={p.id}>
                  {p.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}

        {slotsLoading ? (
          <IonSpinner className="ion-margin-top" />
        ) : (
          <IonList className="ion-margin-top">
            {slots.map((s) => (
              <IonItem
                key={s.startTime}
                button
                color={slot === s.startTime ? 'primary' : undefined}
                onClick={() => setSlot(s.startTime)}
              >
                <IonLabel>
                  {new Date(s.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </IonLabel>
              </IonItem>
            ))}
            {slots.length === 0 && <p className="ion-padding">No times available this day.</p>}
          </IonList>
        )}

        {!authed && (
          <p style={{ color: '#b45309', marginTop: 16 }}>
            Sign in under Account before booking to save your appointment.
          </p>
        )}

        <IonButton
          expand="block"
          className="ion-margin-top"
          disabled={!slot || submitting || !profileStored}
          onClick={() => void submit()}
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </IonButton>
        {message ? <p className="ion-margin-top">{message}</p> : null}
      </IonContent>
    </IonPage>
  );
}
