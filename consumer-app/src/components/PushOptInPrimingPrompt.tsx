import { IonAlert } from '@ionic/react';
import { useEffect, useRef } from 'react';
import {
  buildPushOptInPrimingCopy,
  markPushOptInPrimingShown,
  readPushPrimingDecision,
  recordPushPrimingDecision,
} from '../lib/push-opt-in-priming.util.js';
import { track } from '../lib/app-analytics.js';

export function PushOptInPrimingPrompt({
  isOpen,
  locale,
  onAccept,
  onDecline,
}: {
  isOpen: boolean;
  locale?: string | null;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const copy = buildPushOptInPrimingCopy(locale);
  const trackedShownRef = useRef(false);

  useEffect(() => {
    if (!isOpen || trackedShownRef.current) return;
    trackedShownRef.current = true;
    markPushOptInPrimingShown();
    track('push_priming_shown', { pushOptIn: false });
  }, [isOpen]);

  return (
    <IonAlert
      isOpen={isOpen}
      header={copy.title}
      message={copy.body}
      buttons={[
        {
          text: copy.decline,
          role: 'cancel',
          handler: onDecline,
        },
        {
          text: copy.accept,
          handler: onAccept,
        },
      ]}
      onDidDismiss={() => {
        if (readPushPrimingDecision()) return;
        recordPushPrimingDecision('dismissed');
        track('push_priming_declined', { pushOptIn: false });
        onDecline();
      }}
    />
  );
}
