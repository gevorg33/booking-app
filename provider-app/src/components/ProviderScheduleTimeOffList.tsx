import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { formatDateDisplay } from '../lib/date-format';
import type { ProviderTimeOffRequestSummary } from '../lib/provider-time-off.util';
import { operationFeedbackStore } from '../lib/operation-feedback-store';
import { useI18n } from '../i18n';

function statusLabel(
  status: ProviderTimeOffRequestSummary['status'],
  t: (key: string) => string,
): string {
  switch (status) {
    case 'pending':
      return t('provider.timeOffStatusPending');
    case 'approved':
      return t('provider.timeOffStatusApproved');
    case 'denied':
      return t('provider.timeOffStatusDenied');
    case 'cancelled':
      return t('provider.timeOffStatusCancelled');
    default:
      return status;
  }
}

interface ProviderScheduleTimeOffListProps {
  businessId: string;
  requests: ProviderTimeOffRequestSummary[];
  loading?: boolean;
}

export default function ProviderScheduleTimeOffList({
  businessId,
  requests,
  loading,
}: ProviderScheduleTimeOffListProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/time-off/requests/${requestId}/cancel`,
      );
      return unwrap(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['provider-schedule-summary', businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['provider-time-off-requests', businessId],
      });
    },
    onError: () => {
      operationFeedbackStore.pushError(t('provider.timeOffFailed'));
    },
  });

  if (loading) {
    return (
      <IonCard className="ion-margin-bottom">
        <IonCardContent className="empty-state">
          <IonSpinner />
        </IonCardContent>
      </IonCard>
    );
  }

  if (!requests.length) {
    return (
      <IonCard className="ion-margin-bottom">
        <IonCardHeader>
          <IonCardTitle>{t('provider.timeOffStatusTitle')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p className="booking-meta">{t('provider.timeOffStatusEmpty')}</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="ion-margin-bottom">
      <IonCardHeader>
        <IonCardTitle>{t('provider.timeOffStatusTitle')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList lines="full">
          {requests.map((request) => {
            const range =
              request.startDate === request.endDate
                ? formatDateDisplay(request.startDate)
                : `${formatDateDisplay(request.startDate)} – ${formatDateDisplay(request.endDate)}`;
            return (
              <IonItem key={request.id}>
                <IonLabel>
                  <h3>{range}</h3>
                  <p>
                    {request.dailyStartTime}–{request.dailyEndTime}
                    {request.reason ? ` · ${request.reason}` : ''}
                  </p>
                  {request.reviewNotes ? (
                    <p className="booking-meta">{request.reviewNotes}</p>
                  ) : null}
                </IonLabel>
                <IonBadge color={request.status === 'approved' ? 'success' : request.status === 'denied' ? 'danger' : 'medium'}>
                  {statusLabel(request.status, t)}
                </IonBadge>
                {request.status === 'pending' ? (
                  <IonButton
                    slot="end"
                    fill="clear"
                    size="small"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(request.id)}
                  >
                    {t('provider.timeOffCancel')}
                  </IonButton>
                ) : null}
              </IonItem>
            );
          })}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
}
