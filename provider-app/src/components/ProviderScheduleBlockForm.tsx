import { useCallback, useState } from 'react';
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
import api, { unwrap } from '../services/api';
import { getTodayDateKey } from '../lib/date-format';
import {
  buildProviderSelfBlockPayload,
  PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX,
  PROVIDER_SELF_BLOCK_PRESETS,
} from '../lib/provider-self-block.util';
import { operationFeedbackStore } from '../lib/operation-feedback-store';
import DatePicker from './DatePicker';
import { useI18n } from '../i18n';

interface ProviderScheduleBlockFormProps {
  businessId: string;
  onBlocked?: () => void;
}

export default function ProviderScheduleBlockForm({
  businessId,
  onBlocked,
}: ProviderScheduleBlockFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(getTodayDateKey);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [placeholder, setPlaceholder] = useState('Lunch');

  const applyPreset = useCallback((presetId: (typeof PROVIDER_SELF_BLOCK_PRESETS)[number]['id']) => {
    const preset = PROVIDER_SELF_BLOCK_PRESETS.find((row) => row.id === presetId);
    if (!preset) return;
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setPlaceholder(preset.placeholder);
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = buildProviderSelfBlockPayload({
        date,
        startTime,
        endTime,
        placeholder,
      });
      if (!payload) {
        throw new Error(t('provider.selfBlockInvalidWindow'));
      }
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/schedule/blocks`,
        payload,
      );
      return unwrap<{ id: string }>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['provider-schedule-summary', businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['provider-upcoming', businessId],
      });
      operationFeedbackStore.pushSuccess(t('provider.selfBlockSaved'));
      onBlocked?.();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('provider.selfBlockFailed');
      operationFeedbackStore.pushError(message);
    },
  });

  const payload = buildProviderSelfBlockPayload({
    date,
    startTime,
    endTime,
    placeholder,
  });

  return (
    <IonCard className="schedule-block-form ion-margin-bottom">
      <IonCardHeader>
        <IonCardTitle>{t('provider.selfBlockTitle')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="booking-meta">{t('provider.selfBlockDescription')}</p>

        <div className="schedule-block-form__presets">
          {PROVIDER_SELF_BLOCK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="ai-assistant-quick-chip"
              onClick={() => applyPreset(preset.id)}
            >
              {t(`provider.selfBlockPreset${preset.id === 'lunch' ? 'Lunch' : 'Break'}`)}
            </button>
          ))}
        </div>

        <IonItem lines="full">
          <IonLabel position="stacked">{t('common.date')}</IonLabel>
          <DatePicker value={date} onChange={setDate} min={getTodayDateKey()} />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('appointments.startTime24h')}</IonLabel>
          <input
            type="time"
            className="native-date-input"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('appointments.endTime24h')}</IonLabel>
          <input
            type="time"
            className="native-date-input"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel position="stacked">{t('provider.selfBlockLabel')}</IonLabel>
          <input
            type="text"
            className="native-date-input"
            value={placeholder}
            maxLength={PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX}
            placeholder={t('provider.selfBlockLabelPlaceholder')}
            onChange={(event) => setPlaceholder(event.target.value)}
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
            t('provider.selfBlockSave')
          )}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
}
