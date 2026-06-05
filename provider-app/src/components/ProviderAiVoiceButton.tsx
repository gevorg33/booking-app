import { IonButton, IonIcon } from '@ionic/react';
import { mic, micOff } from 'ionicons/icons';
import { useProviderVoiceInput } from '../lib/use-provider-voice-input';
import type { SpeechRecognitionErrorCode } from '../lib/use-speech-recognition';
import type { AppLocale } from '@shared-i18n/types';

type ProviderAiVoiceButtonProps = {
  disabled?: boolean;
  inputValue?: string;
  locale?: AppLocale | string;
  onTranscript: (text: string) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
  labels: { start: string; stop: string };
};

export function ProviderAiVoiceButton({
  disabled = false,
  inputValue = '',
  locale,
  onTranscript,
  onError,
  labels,
}: ProviderAiVoiceButtonProps) {
  const voice = useProviderVoiceInput({
    locale,
    inputValue,
    onTranscript,
    onError,
  });

  if (!voice.isSupported) return null;

  return (
    <IonButton
      type="button"
      fill="outline"
      className={`ai-assistant-voice-btn${voice.isListening ? ' ai-assistant-voice-btn--active' : ''}`}
      disabled={disabled}
      aria-label={voice.isListening ? labels.stop : labels.start}
      aria-pressed={voice.isListening}
      onClick={() => voice.toggle()}
    >
      <IonIcon icon={voice.isListening ? micOff : mic} slot="icon-only" />
    </IonButton>
  );
}
