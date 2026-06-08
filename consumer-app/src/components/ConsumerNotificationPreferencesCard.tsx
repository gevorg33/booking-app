import { useEffect } from 'react';
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonToggle,
} from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import {
  applyConsumerNotificationPreferencesPatch,
  buildConsumerNotificationPreferencesPatch,
  normalizeConsumerNotificationPreferences,
  type ConsumerNotificationPreferences,
  type ConsumerPushPreferenceKey,
} from '../lib/consumer-notification-preferences.util.js';
import {
  fetchMyNotificationPreferences,
  updateMyNotificationPreferences,
} from '../services/public-api.js';
import { syncConsumerAndroidPushChannels } from '../services/native-push.js';

const PREFERENCE_ROWS: Array<{
  key: ConsumerPushPreferenceKey;
  title: (copy: ConsumerCopy) => string;
  description: (copy: ConsumerCopy) => string;
}> = [
  {
    key: 'pushReminders',
    title: (copy) => copy.notificationPrefsRemindersTitle,
    description: (copy) => copy.notificationPrefsRemindersDescription,
  },
  {
    key: 'pushOffers',
    title: (copy) => copy.notificationPrefsOffersTitle,
    description: (copy) => copy.notificationPrefsOffersDescription,
  },
  {
    key: 'pushNews',
    title: (copy) => copy.notificationPrefsNewsTitle,
    description: (copy) => copy.notificationPrefsNewsDescription,
  },
];

export function ConsumerNotificationPreferencesCard({
  slug,
  copy,
  authed,
}: {
  slug: string;
  copy: ConsumerCopy;
  authed: boolean;
}) {
  const queryClient = useQueryClient();
  const prefsQuery = useQuery({
    queryKey: ['notification-preferences', slug],
    queryFn: async () =>
      normalizeConsumerNotificationPreferences(
        await fetchMyNotificationPreferences(slug),
      ),
    enabled: authed,
  });

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<ConsumerNotificationPreferences>) =>
      updateMyNotificationPreferences(slug, patch),
    onSuccess: (raw) => {
      const normalized = normalizeConsumerNotificationPreferences(raw);
      queryClient.setQueryData(['notification-preferences', slug], normalized);
      void syncConsumerAndroidPushChannels(normalized);
    },
  });

  if (!authed) return null;

  const prefs = prefsQuery.data;
  const savingKey = saveMutation.variables
    ? (Object.keys(saveMutation.variables)[0] as ConsumerPushPreferenceKey | undefined)
    : undefined;

  useEffect(() => {
    if (!prefs) return;
    void syncConsumerAndroidPushChannels(prefs);
  }, [prefs]);

  const onToggle = (key: ConsumerPushPreferenceKey, enabled: boolean) => {
    if (!prefs) return;
    const optimistic = applyConsumerNotificationPreferencesPatch(
      prefs,
      buildConsumerNotificationPreferencesPatch(key, enabled),
    );
    queryClient.setQueryData(['notification-preferences', slug], optimistic);
    saveMutation.mutate(buildConsumerNotificationPreferencesPatch(key, enabled));
  };

  return (
    <section style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <IonIcon icon={notificationsOutline} style={{ fontSize: 20 }} />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{copy.notificationPrefsSectionTitle}</h2>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 0 }}>
        {copy.notificationPrefsSectionHint}
      </p>
      {prefsQuery.isLoading ? (
        <IonSpinner name="crescent" />
      ) : prefs ? (
        <IonList className="salon-card" style={{ padding: 0 }}>
          {PREFERENCE_ROWS.map((row) => (
            <IonItem key={row.key} lines="full">
              <IonLabel className="ion-text-wrap">
                <h3 style={{ fontWeight: 600 }}>{row.title(copy)}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {row.description(copy)}
                </p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={prefs[row.key]}
                disabled={saveMutation.isPending && savingKey === row.key}
                onIonChange={(event) => onToggle(row.key, event.detail.checked)}
              />
            </IonItem>
          ))}
        </IonList>
      ) : (
        <p style={{ color: '#6b7280' }}>{copy.notificationPrefsLoadFailed}</p>
      )}
      {saveMutation.isError ? (
        <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
          {copy.notificationPrefsSaveFailed}
        </p>
      ) : null}
    </section>
  );
}
