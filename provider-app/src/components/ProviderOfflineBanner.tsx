import { IonText } from '@ionic/react';
import { useEffect, useState } from 'react';
import { loadQueue } from '../lib/offline-queue';
import { useOnlineStatus } from '../lib/use-online-status';
import { useI18n } from '../i18n';

/** Shows offline / queued-mutation status for provider tabs. */
export function ProviderOfflineBanner() {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(() => loadQueue().length);

  useEffect(() => {
    const refresh = () => setQueuedCount(loadQueue().length);
    refresh();
    window.addEventListener('provider:offline-queue-changed', refresh);
    window.addEventListener('online', refresh);
    return () => {
      window.removeEventListener('provider:offline-queue-changed', refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  if (online && queuedCount === 0) return null;

  return (
    <div className="provider-offline-banner ion-padding-horizontal ion-padding-top">
      <IonText color={online ? 'warning' : 'medium'}>
        <p className="booking-meta">
          {!online
            ? t('provider.offlineStatusOffline')
            : t('provider.offlineStatusSyncing', { count: queuedCount })}
        </p>
      </IonText>
    </div>
  );
}
