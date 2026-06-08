import { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import {
  CONSUMER_FOREGROUND_PUSH_EVENT,
  type ConsumerForegroundPushDetail,
} from '../lib/consumer-push-foreground.util.js';
import { dispatchConsumerPushEffects } from '../lib/consumer-native-push.util.js';

/** In-app banner when a push arrives while the app is foregrounded (adopt-4.3). */
export function ConsumerPushForegroundHost() {
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    detail?: ConsumerForegroundPushDetail;
  }>({ open: false, message: '' });

  useEffect(() => {
    const onForegroundPush = (event: Event) => {
      const detail = (event as CustomEvent<ConsumerForegroundPushDetail>).detail;
      if (!detail?.message?.trim()) return;
      setToast({ open: true, message: detail.message, detail });
    };
    window.addEventListener(CONSUMER_FOREGROUND_PUSH_EVENT, onForegroundPush);
    return () =>
      window.removeEventListener(CONSUMER_FOREGROUND_PUSH_EVENT, onForegroundPush);
  }, []);

  return (
    <IonToast
      isOpen={toast.open}
      message={toast.message}
      duration={8000}
      position="top"
      buttons={[
        {
          text: 'View',
          handler: () => {
            if (toast.detail?.payload) {
              dispatchConsumerPushEffects(toast.detail.payload);
            }
          },
        },
        {
          text: 'Dismiss',
          role: 'cancel',
        },
      ]}
      onDidDismiss={() => setToast((prev) => ({ ...prev, open: false }))}
    />
  );
}
