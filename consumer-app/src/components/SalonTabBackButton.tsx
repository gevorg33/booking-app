import { IonButton, IonIcon, useIonRouter } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { navigateToSalonTab } from '../lib/salon-tab-navigation.util.js';
import type { SalonTabId } from '../lib/salon-tab-route.util.js';

type Props = {
  slug: string;
  tab: SalonTabId;
  text?: string;
};

/** Back to a salon tab with replace — avoids blank stacked tab shells on Android. */
export function SalonTabBackButton({ slug, tab, text }: Props) {
  const history = useHistory();
  const ionRouter = useIonRouter();

  return (
    <IonButton
      fill="clear"
      onClick={() => navigateToSalonTab(history, slug, tab, ionRouter)}
      aria-label={text ?? 'Back'}
    >
      <IonIcon slot="start" icon={chevronBackOutline} />
      {text}
    </IonButton>
  );
}
