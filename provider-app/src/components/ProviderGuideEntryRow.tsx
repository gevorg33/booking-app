import { IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { bookOutline } from 'ionicons/icons';
import { useI18n } from '../i18n';

/** Profile tab row — opens native guide (ai-guide-1.9.8). */
export function ProviderGuideEntryRow({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n();

  return (
    <IonList lines="full" className="ion-margin-bottom">
      <IonItem
        button
        detail
        onClick={onOpen}
        aria-label={t('provider.guidePageAccountEntryHint')}
      >
        <IonIcon icon={bookOutline} slot="start" color="primary" />
        <IonLabel>
          <h2>{t('provider.guidePageTitle')}</h2>
          <p>{t('provider.guidePageAccountEntryHint')}</p>
        </IonLabel>
      </IonItem>
    </IonList>
  );
}
