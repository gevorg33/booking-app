import { IonAlert } from '@ionic/react';
import { useEffect, useRef } from 'react';
import {
  buildPushDeniedReaskCopy,
  buildPushDeniedReaskShownAnalyticsProps,
  markPushSettingsReaskShown,
  openPushDeniedReaskSettings,
} from '../lib/push-denied-reask.util.js';
import { track } from '../lib/app-analytics.js';

export function PushSettingsReaskPrompt({
  isOpen,
  locale,
  onDismiss,
}: {
  isOpen: boolean;
  locale?: string | null;
  onDismiss: () => void;
}) {
  const copy = buildPushDeniedReaskCopy(locale);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || trackedRef.current) return;
    trackedRef.current = true;
    markPushSettingsReaskShown();
    track('push_settings_reask_shown', buildPushDeniedReaskShownAnalyticsProps());
  }, [isOpen]);

  return (
    <IonAlert
      isOpen={isOpen}
      header={copy.title}
      message={copy.body}
      buttons={[
        { text: copy.skip, role: 'cancel', handler: onDismiss },
        {
          text: copy.openSettings,
          handler: () => {
            void openPushDeniedReaskSettings();
            onDismiss();
          },
        },
      ]}
      onDidDismiss={() => onDismiss()}
    />
  );
}
