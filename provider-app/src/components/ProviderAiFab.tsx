import { IonIcon } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';
import { useI18n } from '../i18n';

/** Floating AI entry — opens assistant via provider:ai-prompt (ai-m3). */
export function ProviderAiFab() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent('provider:ai-prompt', {
            detail: { prompt: t('provider.seedPromptToday') },
          }),
        );
      }}
      className="provider-ai-fab"
      aria-label={t('provider.openAssistantFab')}
    >
      <IonIcon icon={sparklesOutline} style={{ fontSize: 28 }} />
    </button>
  );
}
