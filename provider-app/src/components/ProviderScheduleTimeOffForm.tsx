import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/react';
import { useState } from 'react';
import api, { unwrap } from '../services/api';
import { getTodayDateKey } from '../lib/date-format';
import { buildProviderTimeOffPayload } from '../lib/provider-time-off.util';
import { operationFeedbackStore } from '../lib/operation-feedback-store';
import DatePicker from './DatePicker';
import { useI18n } from '../i18n';

interface ProviderScheduleTimeOffFormProps {
  businessId: string;
  onSubmitted?: () => void;
}

export default function ProviderScheduleTimeOffForm({
  businessId,
  onSubmitted,
}: ProviderScheduleTimeOffFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(getTodayDateKey);
  const [endDate, setEndDate] = useState(getTodayDateKey);
  const [dailyStartTime, setDailyStartTime] = useState('00:00');
  const [dailyEndTime, setDailyEndTime] = useState('23:59');
  const [reason, setReason] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildProviderTimeOffPayload({
        startDate,
        endDate,
        dailyStartTime,
        dailyEndTime,
        reason,
      });
      if (!payload) throw new Error(t('provider.timeOffFailed'));
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/time-off/requests`,
        payload,
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
      operationFeedbackStore.pushSuccess(t('provider.timeOffSubmitted'));
      onSubmitted?.();
    },
    onError: () => {
      operationFeedbackStore.pushError(t('provider.timeOffFailed'));
    },
  });

  const payload = buildProviderTimeOffPayload({
    startDate,
    endDate,
    dailyStartTime,
    dailyEndTime,
    reason,
  });

  return (
    <IonCard className="schedule-time-off-form ion-margin-bottom">
      <IonCardHeader>
        <IonCardTitle>{t('provider.timeOffTitle')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="booking-meta">{t('provider.timeOffDescription')}</p>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('provider.timeOffStartDate')}</IonLabel>
          <DatePicker value={startDate} onChange={setStartDate} min={getTodayDateKey()} />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('provider.timeOffEndDate')}</IonLabel>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            min={startDate || getTodayDateKey()}
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('appointments.startTime24h')}</IonLabel>
          <input
            type="time"
            className="native-date-input"
            value={dailyStartTime}
            onChange={(event) => setDailyStartTime(event.target.value)}
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('appointments.endTime24h')}</IonLabel>
          <input
            type="time"
            className="native-date-input"
            value={dailyEndTime}
            onChange={(event) => setDailyEndTime(event.target.value)}
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('provider.timeOffReason')}</IonLabel>
          <input
            type="text"
            className="native-date-input"
            value={reason}
            placeholder={t('provider.timeOffReasonPlaceholder')}
            onChange={(event) => setReason(event.target.value)}
          />
        </IonItem>
        <IonButton
          expand="block"
          className="ion-margin-top"
          disabled={!payload || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? (
            <IonSpinner name="crescent" />
          ) : (
            t('provider.timeOffSubmit')
          )}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
