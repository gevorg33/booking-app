import { IonButton, IonButtons, IonIcon } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { backConsumerRoute } from '../lib/consumer-ion-navigation.util.js';

type Props = {
  defaultHref: string;
  text?: string;
};

/** Ionic-aware back — avoids blank pages when Android stack desyncs from React Router. */
export function ConsumerBackButton({ defaultHref, text }: Props) {
  const history = useHistory();
  const ionRouter = useIonRouter();

  return (
    <IonButtons slot="start">
      <IonButton
        fill="clear"
        onClick={() => backConsumerRoute(history, ionRouter, defaultHref)}
        aria-label={text ?? 'Back'}
      >
        <IonIcon slot="icon-only" icon={chevronBackOutline} />
      </IonButton>
    </IonButtons>
  );
}
