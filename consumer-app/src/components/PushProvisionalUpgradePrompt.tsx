import { IonAlert } from '@ionic/react';
import { useEffect, useRef } from 'react';
import {
  buildProvisionalToFullUpgradeCopy,
  buildProvisionalToFullUpgradeShownAnalyticsProps,
  markProvisionalUpgradeShown,
} from '../lib/provisional-to-full-push.util.js';
import { track } from '../lib/app-analytics.js';

export function PushProvisionalUpgradePrompt({
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
  const copy = buildProvisionalToFullUpgradeCopy(locale);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || trackedRef.current) return;
    trackedRef.current = true;
    markProvisionalUpgradeShown();
    track(
      'push_provisional_upgrade_shown',
      buildProvisionalToFullUpgradeShownAnalyticsProps(),
    );
  }, [isOpen]);

  return (
    <IonAlert
      isOpen={isOpen}
      header={copy.title}
      message={copy.body}
      buttons={[
        { text: copy.decline, role: 'cancel', handler: onDecline },
        { text: copy.accept, handler: onAccept },
      ]}
    />
  );
}
