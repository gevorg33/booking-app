import { IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { bookOutline } from 'ionicons/icons';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';

/** Account tab row — opens native guide (ai-guide-1.9.3). */
export function ConsumerGuideEntryRow({
  copy,
  onOpen,
  primaryColor,
}: {
  copy: ConsumerCopy;
  onOpen: () => void;
  /** Exact brand hex — keep in sync with Sign in / other primary CTAs. */
  primaryColor?: string;
}) {
  const brand = primaryColor?.trim() || 'var(--tenant-primary, var(--ion-color-primary))';

  return (
    <IonList lines="full" className="ion-margin-bottom">
      <IonItem button detail onClick={onOpen} aria-label={copy.guidePageAccountEntryHint}>
        <IonIcon
          icon={bookOutline}
          slot="start"
          style={{ color: brand }}
          aria-hidden="true"
        />
        <IonLabel>
          <h2>{copy.guidePageTitle}</h2>
          <p>{copy.guidePageAccountEntryHint}</p>
        </IonLabel>
      </IonItem>
    </IonList>
  );
}
