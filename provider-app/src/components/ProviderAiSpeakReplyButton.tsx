import { IonButton, IonIcon } from '@ionic/react';
import { volumeHighOutline } from 'ionicons/icons';
import { localeToSpeechLang, speakText } from '../lib/use-speech-recognition';

export function ProviderAiSpeakReplyButton({
  text,
  locale,
  label,
}: {
  text: string;
  locale: string;
  label: string;
}) {
  if (!text.trim()) return null;

  return (
    <IonButton
      size="small"
      fill="clear"
      className="ai-assistant-speak-btn"
      onClick={() => speakText(text, localeToSpeechLang(locale))}
    >
      <IonIcon icon={volumeHighOutline} slot="start" />
      {label}
    </IonButton>
  );
}
