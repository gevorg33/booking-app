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
import { useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import {
  createBooking,
  fetchPublicProviders,
  fetchPublicServices,
  fetchServiceSlots,
  quotePublicBooking,
} from '../services/public-api.js';
import { CheckoutTaxSummary } from '../components/CheckoutTaxSummary.js';
import type { PublicCheckoutQuote } from '../lib/types.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
  setCustomerSession,
} from '../lib/customer-auth.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { computeBookingSuccessEndTime } from '../lib/checkout-recommendations.js';
import { formatBookingDateTimeRange } from '../lib/date-format.js';
import { ConsumerCheckoutIntakeStep } from '../components/ConsumerCheckoutIntakeStep.js';
import { ConsumerProductRecommendationCards } from '../components/ConsumerProductRecommendationCards.js';

export default function BookPage() {
  const { serviceId } = useParams<{ slug: string; serviceId: string }>();
  const location = useLocation();
  const clinicOrderToken = useMemo(() => {
    const value = new URLSearchParams(location.search).get('clinicOrderToken');
    return value?.trim() || undefined;
  }, [location.search]);
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug, profile ?? { locale: 'en' });
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState('');
  const [slot, setSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{
    bookingId: string;
    startTime: string;
    endTime: string;
    quote: PublicCheckoutQuote | null;
  } | null>(null);

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

  const [bookingPhase, setBookingPhase] = useState<'schedule' | 'intake'>('schedule');
  const [preVisitIntakeId, setPreVisitIntakeId] = useState<string | undefined>();

  const profileStored = slug ? getStoredCustomerProfile(slug) : null;
  const authed = slug ? !!getCustomerToken(slug) : false;

  const showIntakeStep = Boolean(service?.offersPreVisitIntake && authed);

  const minDate = useMemo(() => new Date().toISOString(), []);

  const { data: checkoutQuote } = useQuery({
    queryKey: ['booking-quote', slug, serviceId],
    queryFn: () => quotePublicBooking(slug!, { serviceId: serviceId! }),
    enabled: !!slug && !!serviceId && !bookingSuccess,
  });

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

  const submit = async (linkedIntakeId?: string) => {
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
        ...(linkedIntakeId ?? preVisitIntakeId
          ? { preVisitIntakeId: linkedIntakeId ?? preVisitIntakeId }
          : {}),
        ...(clinicOrderToken ? { clinicOrderToken } : {}),
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
      if (clinicOrderToken) {
        void queryClient.invalidateQueries({
          queryKey: ['clinic-lab-booking-requests', slug],
        });
      }
      setBookingSuccess({
        bookingId: result.booking.id,
        startTime: slot,
        endTime: computeBookingSuccessEndTime(slot, service.durationMinutes),
        quote: checkoutQuote ?? null,
      });
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
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
        <IonContent className="ion-padding ion-text-center">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '2rem auto 1rem',
            }}
            aria-hidden
          >
            ✓
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{copy.bookingConfirmed}</h2>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.875rem' }}>
            {formatBookingDateTimeRange(
              bookingSuccess.startTime,
              bookingSuccess.endTime,
              locale,
            )}
          </p>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.875rem', maxWidth: 320, marginInline: 'auto' }}>
            {copy.bookingConfirmedHint}
          </p>
          {bookingSuccess.quote && (
            <div style={{ maxWidth: 360, margin: '16px auto 0' }}>
              <CheckoutTaxSummary
                quote={bookingSuccess.quote}
                currency={bookingSuccess.quote.currency}
                tenantCurrency={profile.currency}
                labels={{
                  subtotal: copy.checkoutSubtotal,
                  totalDue: copy.checkoutTotalDue,
                  taxIncluded: copy.taxIncluded,
                }}
              />
            </div>
          )}
          <ConsumerProductRecommendationCards
            slug={slug}
            service={service}
            tenantCurrency={profile.currency}
            bookingId={bookingSuccess.bookingId}
            copy={copy}
          />
          <IonButton
            expand="block"
            className="ion-margin-top"
            routerLink={buildSalonPath(slug, '/account')}
          >
            {copy.viewAppointments}
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            className="ion-margin-top"
            routerLink={buildSalonPath(slug, '/services')}
          >
            {copy.bookAnotherService}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  if (bookingPhase === 'intake' && showIntakeStep) {
    return (
      <ConsumerCheckoutIntakeStep
        slug={slug}
        serviceId={service.id}
        copy={copy}
        onSkip={() => {
          setBookingPhase('schedule');
          void submit();
        }}
        onCompleted={(intakeId) => {
          setPreVisitIntakeId(intakeId);
          setBookingPhase('schedule');
          void submit(intakeId);
        }}
      />
    );
  }

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

        {checkoutQuote && (
          <CheckoutTaxSummary
            quote={checkoutQuote}
            currency={checkoutQuote.currency}
            tenantCurrency={profile.currency}
            labels={{
              subtotal: copy.checkoutSubtotal,
              totalDue: copy.checkoutTotalDue,
              taxIncluded: copy.taxIncluded,
            }}
          />
        )}

        <IonButton
          expand="block"
          className="ion-margin-top"
          disabled={!slot || submitting || !profileStored}
          onClick={() => {
            if (showIntakeStep && bookingPhase === 'schedule') {
              setBookingPhase('intake');
              return;
            }
            void submit();
          }}
        >
          {submitting
            ? 'Booking…'
            : showIntakeStep && bookingPhase === 'schedule'
              ? copy.publicIntakeContinueToBooking
              : 'Confirm booking'}
        </IonButton>
        {message ? <p className="ion-margin-top">{message}</p> : null}
      </IonContent>
    </IonPage>
  );
}
