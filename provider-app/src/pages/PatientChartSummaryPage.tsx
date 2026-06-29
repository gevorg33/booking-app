import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay, formatTimeDisplay } from '../lib/date-format';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';
import { isTeamView } from '../lib/provider-access';
import type { ProviderPatientChartSummary } from '../lib/provider-patient-chart';
import { ClinicLabStatusBadge } from '../components/ClinicLabStatusBadge';
import BookingDetailModal from '../components/BookingDetailModal';

export default function PatientChartSummaryPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { customerId } = useParams<{ customerId: string }>();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-patient-chart', business?.id, customerId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/patients/${customerId}/chart-summary`,
      );
      return unwrap<ProviderPatientChartSummary>(res);
    },
    enabled: !!business?.id && !!customerId,
  });

  if (data && !data.labFeaturesEnabled) {
    return (
      <ProviderTabPageShell embedded={embedded}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/patients" text={t('provider.back')} />
            </IonButtons>
            <IonTitle>{t('provider.patientChartTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ProviderTabScrollContent className="ion-padding">
          <p className="ion-text-center ion-padding">{t('clinic.labState.gate.disabledReason')}</p>
        </ProviderTabScrollContent>
      </ProviderTabPageShell>
    );
  }

  const profile = data?.clinicalProfile;
  const customer = data?.customer;

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/patients" text={t('provider.back')} />
          </IonButtons>
          <IonTitle>{customer?.name ?? t('provider.patientChartTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        {isLoading ? (
          <div className="empty-state">
            <IonSpinner />
          </div>
        ) : error ? (
          <p className="empty-state">{t('provider.patientChartLoadFailed')}</p>
        ) : !data?.canAccessChart || !customer ? (
          <p className="empty-state">{t('clinic.patientChart.phiMaskedNotice')}</p>
        ) : (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{t('clinic.patientChart.demographicsTitle')}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>{customer.name}</p>
                {customer.phone && <p>{customer.phone}</p>}
                {customer.email && <p className="booking-meta">{customer.email}</p>}
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{t('clinic.patientChart.clinicalProfileTitle')}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {profile?.phiMasked ? (
                  <p className="booking-meta">{t('clinic.patientChart.phiMaskedNotice')}</p>
                ) : (
                  <>
                    <p>
                      <strong>{t('clinic.patientChart.fields.allergies')}:</strong>{' '}
                      {profile?.allergies ?? '—'}
                    </p>
                    <p>
                      <strong>{t('clinic.patientChart.fields.chronicProblems')}:</strong>{' '}
                      {profile?.chronicProblems ?? '—'}
                    </p>
                    <p>
                      <strong>{t('clinic.patientChart.fields.bloodType')}:</strong>{' '}
                      {profile?.bloodType ?? '—'}
                    </p>
                    <p>
                      <strong>{t('clinic.patientChart.fields.emergencyContactName')}:</strong>{' '}
                      {profile?.emergencyContactName ?? '—'}
                    </p>
                    <p>
                      <strong>{t('clinic.patientChart.fields.emergencyContactPhone')}:</strong>{' '}
                      {profile?.emergencyContactPhone ?? '—'}
                    </p>
                  </>
                )}
              </IonCardContent>
            </IonCard>

            <h2 className="ion-padding-top">{t('provider.patientChartTodaysOrders')}</h2>
            {!data.todaysOrders.length ? (
              <p className="booking-meta">{t('clinic.patientChart.ordersEmpty')}</p>
            ) : (
              data.todaysOrders.map((order) => (
                <IonCard
                  key={order.id}
                  button={!!order.bookingId}
                  onClick={() => {
                    if (order.bookingId) setSelectedBookingId(order.bookingId);
                  }}
                >
                  <IonCardHeader>
                    <IonCardTitle>
                      {order.displayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ marginBottom: '8px' }}>
                      <ClinicLabStatusBadge kind="order" status={order.status} />
                    </div>
                    {order.bookingStartTime && (
                      <p className="booking-meta">
                        {formatDateDisplay(order.bookingStartTime)}{' '}
                        {formatTimeDisplay(order.bookingStartTime)}
                      </p>
                    )}
                    {order.department && <p className="booking-meta">{order.department}</p>}
                    {isTeamView(data.viewMode) && order.employeeName && (
                      <p className="booking-meta">
                        {t('common.provider')}: {order.employeeName}
                      </p>
                    )}
                  </IonCardContent>
                </IonCard>
              ))
            )}

            <h2 className="ion-padding-top">{t('provider.patientChartTodaysResults')}</h2>
            {!data.todaysResults.length ? (
              <p className="booking-meta">{t('clinic.patientChart.resultsEmpty')}</p>
            ) : (
              data.todaysResults.map((result) => (
                <IonCard
                  key={result.id}
                  button={!!result.bookingId}
                  onClick={() => {
                    if (result.bookingId) setSelectedBookingId(result.bookingId);
                  }}
                >
                  <IonCardHeader>
                    <IonCardTitle>
                      {result.testName ?? t('clinic.labState.resultsTab.unnamedResult')}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ marginBottom: '8px' }}>
                      <ClinicLabStatusBadge kind="result" status={result.status} />
                    </div>
                    {result.bookingStartTime && (
                      <p className="booking-meta">
                        {formatDateDisplay(result.bookingStartTime)}{' '}
                        {formatTimeDisplay(result.bookingStartTime)}
                      </p>
                    )}
                    {result.department && <p className="booking-meta">{result.department}</p>}
                    {result.measurementFlag && (
                      <p className="booking-meta">{result.measurementFlag}</p>
                    )}
                    {isTeamView(data.viewMode) && result.employeeName && (
                      <p className="booking-meta">
                        {t('common.provider')}: {result.employeeName}
                      </p>
                    )}
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </>
        )}

        {business?.id && (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </ProviderTabScrollContent>
    </ProviderTabPageShell>
  );
}
