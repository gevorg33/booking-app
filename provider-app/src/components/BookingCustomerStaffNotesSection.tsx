import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { formatDateDisplay } from '../lib/date-format';
import {
  PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH,
  type ProviderBookingCustomerStaffNotesList,
} from '../lib/provider-booking-customer-staff-notes.types';
import { useI18n } from '../i18n';

interface BookingCustomerStaffNotesSectionProps {
  businessId: string;
  bookingId: string;
}

export default function BookingCustomerStaffNotesSection({
  businessId,
  bookingId,
}: BookingCustomerStaffNotesSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['provider-booking-customer-staff-notes', businessId, bookingId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/provider/bookings/${bookingId}/customer-staff-notes`,
      );
      return unwrap<ProviderBookingCustomerStaffNotesList>(res);
    },
    enabled: !!businessId && !!bookingId,
  });

  const createMutation = useMutation({
    mutationFn: async (body: string) => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/bookings/${bookingId}/customer-staff-notes`,
        { body },
      );
      return unwrap(res);
    },
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({
        queryKey: ['provider-booking-customer-staff-notes', businessId, bookingId],
      });
    },
  });

  const maxLength = data?.maxLength ?? PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH;
  const notes = data?.notes ?? [];
  const canCreate = data?.canCreate ?? false;
  const trimmedDraft = draft.trim();
  const overLimit = draft.length > maxLength;

  return (
    <div className="ion-margin-bottom customer-staff-notes">
      <h3>{t('provider.customerStaffNotesTitle')}</h3>
      <IonText color="medium">
        <p className="booking-meta">{t('provider.customerStaffNotesInternalNotice')}</p>
      </IonText>

      {isLoading ? (
        <div className="empty-state">
          <IonSpinner name="crescent" />
        </div>
      ) : notes.length === 0 ? (
        <IonText color="medium">
          <p className="booking-meta">{t('provider.customerStaffNotesEmpty')}</p>
        </IonText>
      ) : (
        <ul className="customer-staff-notes__list">
          {notes.map((note) => (
            <li key={note.id} className="customer-staff-notes__item">
              <div className="customer-staff-notes__meta">
                <span>{note.authorName ?? t('provider.customerStaffNotesUnknownAuthor')}</span>
                <span>{formatDateDisplay(note.createdAt)}</span>
              </div>
              {note.phiMasked ? (
                <IonText color="warning">
                  <p className="booking-meta">{t('clinic.patientChart.phiMaskedNotice')}</p>
                </IonText>
              ) : (
                <p className="customer-staff-notes__body">{note.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <>
          <IonItem lines="none" className="ion-margin-top">
            <IonLabel position="stacked">{t('provider.customerStaffNotesAddLabel')}</IonLabel>
            <IonTextarea
              value={draft}
              rows={3}
              maxlength={maxLength}
              placeholder={t('provider.customerStaffNotesPlaceholder')}
              onIonInput={(e) => setDraft(e.detail.value ?? '')}
            />
          </IonItem>
          <div className="customer-staff-notes__footer">
            <IonText color={overLimit ? 'danger' : 'medium'}>
              <span className="booking-meta">
                {t('provider.customerStaffNotesCharCount', {
                  count: draft.length,
                  max: maxLength,
                })}
              </span>
            </IonText>
            <IonButton
              size="small"
              disabled={
                createMutation.isPending || !trimmedDraft || overLimit
              }
              onClick={() => createMutation.mutate(trimmedDraft)}
            >
              {createMutation.isPending ? (
                <IonSpinner name="crescent" />
              ) : (
                t('provider.customerStaffNotesAddButton')
              )}
            </IonButton>
          </div>
        </>
      )}
    </div>
  );
}
