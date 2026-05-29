import { IonIcon } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';

/** Floating AI entry — opens assistant via provider:ai-prompt (ai-m3). */
export function ProviderAiFab() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent('provider:ai-prompt', { detail: { prompt: "What's on my schedule today?" } }),
        );
      }}
      className="provider-ai-fab"
      aria-label="Open AI assistant"
    >
      <IonIcon icon={sparklesOutline} style={{ fontSize: 28 }} />
    </button>
  );
}
