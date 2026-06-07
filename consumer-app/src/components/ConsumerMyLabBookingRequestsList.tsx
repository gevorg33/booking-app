import { IonButton, IonSpinner } from '@ionic/react';
import { consumerCopyForLocale, formatCopy } from '../lib/copy.js';
import { formatDateDisplay } from '../lib/date-format.js';
import {
  buildLabBookingRequestPath,
  type PublicClinicLabBookingRequest,
} from '../lib/public-clinic-lab-booking-requests.js';

export interface ConsumerMyLabBookingRequestsListProps {
  slug: string;
  requests: PublicClinicLabBookingRequest[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function ConsumerMyLabBookingRequestsList({
  slug,
  requests,
  loading,
  error,
  locale,
}: ConsumerMyLabBookingRequestsListProps) {
  const copy = consumerCopyForLocale(locale);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>;
  }

  if (requests.length === 0) {
    return (
      <div className="salon-card" style={{ textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>{copy.myLabToBookEmpty}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {requests.map((request) => (
        <article key={request.orderId} className="salon-card">
          <h3 style={{ fontWeight: 600 }}>
            {request.displayNames ?? copy.myLabToBookUnnamedOrder}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: 8 }}>
            {formatCopy(copy.myLabToBookCollectionService, {
              service: request.collectionServiceName,
            })}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
            {formatCopy(copy.myLabToBookRequestedOn, {
              date: formatDateDisplay(request.pushedAt, locale),
            })}
          </p>
          <IonButton
            expand="block"
            size="small"
            className="ion-margin-top"
            routerLink={buildLabBookingRequestPath(
              slug,
              request.collectionServiceId,
              request.token,
            )}
          >
            {copy.myLabToBookBookCollection}
          </IonButton>
        </article>
      ))}
    </div>
  );
}
