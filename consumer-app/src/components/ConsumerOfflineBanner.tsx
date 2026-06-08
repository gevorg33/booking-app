import { IonText } from '@ionic/react';
import { useEffect, useState } from 'react';
import { CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT } from '../lib/consumer-api-offline.util.js';
import { loadQueue } from '../lib/offline-queue.js';
import { useOnlineStatus } from '../lib/use-online-status.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatCopy } from '../lib/copy.js';

/** Offline / queued mutation banner (adopt-5.3 / adopt-5.4). */
export function ConsumerOfflineBanner({
  copy,
  fromCache = false,
}: {
  copy: ConsumerCopy;
  fromCache?: boolean;
}) {
  const online = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(() => loadQueue().length);

  useEffect(() => {
    const refresh = () => setQueuedCount(loadQueue().length);
    refresh();
    window.addEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, refresh);
    window.addEventListener('online', refresh);
    return () => {
      window.removeEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  if (online && queuedCount === 0 && !fromCache) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="ion-padding-horizontal ion-padding-top"
    >
      <IonText color={online ? 'warning' : 'medium'}>
        {!online ? (
          <p style={{ fontSize: '0.875rem', margin: 0 }}>{copy.offlineStatusOffline}</p>
        ) : null}
        {fromCache ? (
          <p style={{ fontSize: '0.875rem', margin: online ? 0 : '8px 0 0' }}>
            {copy.offlineCachedSalon}
          </p>
        ) : null}
        {online && queuedCount > 0 ? (
          <p style={{ fontSize: '0.875rem', margin: fromCache ? '8px 0 0' : 0 }}>
            {formatCopy(copy.offlineStatusSyncing, { count: String(queuedCount) })}
          </p>
        ) : null}
      </IonText>
    </div>
  );
}
