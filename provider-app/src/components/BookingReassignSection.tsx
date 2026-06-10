import { useEffect, useState } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/react';
import type { BookingDetail } from '../lib/booking-types';
import {
  fetchProviderReassignOptions,
  reassignProviderBooking,
  type ProviderReassignOptions,
} from '../lib/provider-booking-reassign';
import { useI18n } from '../i18n';

interface BookingReassignSectionProps {
  businessId: string;
  booking: BookingDetail;
  onReassigned: () => void;
}

export default function BookingReassignSection({
  businessId,
  booking,
  onReassigned,
}: BookingReassignSectionProps) {
  const { t } = useI18n();
  const [options, setOptions] = useState<ProviderReassignOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking.reassign?.allowed) {
      setOptions(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchProviderReassignOptions(businessId, booking.id)
      .then((result) => {
        if (cancelled) return;
        setOptions(result);
        setSelectedEmployeeId(result.options[0]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) setError(t('provider.reassignLoadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, booking.id, booking.reassign?.allowed, t]);

  if (!booking.reassign?.allowed) {
    return booking.reassign?.reason ? (
      <p className="booking-meta">{booking.reassign.reason}</p>
    ) : null;
  }

  return (
    <div className="ion-margin-bottom">
      <h3>{t('provider.reassignTitle')}</h3>
      <p className="booking-meta">{t('provider.reassignHint')}</p>
      {loading ? (
        <IonSpinner />
      ) : error ? (
        <p className="booking-meta">{error}</p>
      ) : !options?.options.length ? (
        <p className="booking-meta">{t('provider.reassignNoOptions')}</p>
      ) : (
        <>
          <IonItem lines="full">
            <IonLabel>{t('provider.reassignSelectProvider')}</IonLabel>
            <IonSelect
              interface="popover"
              value={selectedEmployeeId}
              onIonChange={(event) => setSelectedEmployeeId(String(event.detail.value))}
            >
              {options.options.map((provider) => (
                <IonSelectOption key={provider.id} value={provider.id}>
                  {provider.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonButton
            expand="block"
            className="ion-margin-top"
            disabled={!selectedEmployeeId || submitting}
            onClick={() => {
              if (!selectedEmployeeId) return;
              setSubmitting(true);
              setError(null);
              void reassignProviderBooking(businessId, booking.id, {
                employeeId: selectedEmployeeId,
                expectedUpdatedAt: booking.updatedAt,
              })
                .then(() => onReassigned())
                .catch(() => setError(t('provider.reassignFailed')))
                .finally(() => setSubmitting(false));
            }}
          >
            {submitting ? t('provider.reassignWorking') : t('provider.reassignConfirm')}
          </IonButton>
        </>
      )}
      {error && !loading ? <p className="booking-meta">{error}</p> : null}
    </div>
  );
}
