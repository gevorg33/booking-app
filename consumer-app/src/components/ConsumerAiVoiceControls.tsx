import { IonButton, IonIcon } from '@ionic/react';
import { mic, micOff, volumeHighOutline } from 'ionicons/icons';
import {
  localeToSpeechLang,
  speakText,
  useSpeechRecognition,
  type SpeechRecognitionErrorCode,
} from '../lib/use-speech-recognition.js';

export function ConsumerAiVoiceInputButton({
  disabled,
  locale,
  labels,
  primaryColor,
  onTranscript,
  onError,
}: {
  disabled?: boolean;
  locale: string;
  labels: { start: string; stop: string };
  primaryColor?: string;
  onTranscript: (text: string) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
}) {
  const { isSupported, isListening, toggle } = useSpeechRecognition({
    lang: localeToSpeechLang(locale),
    onTranscript: (text, meta) => {
      if (meta.isFinal || text) onTranscript(text);
    },
    onError,
  });

  if (!isSupported) return null;

  return (
    <IonButton
      fill="clear"
      disabled={disabled}
      aria-label={isListening ? labels.stop : labels.start}
      style={{ '--color': primaryColor ?? undefined, margin: 0 }}
      onClick={toggle}
    >
      <IonIcon icon={isListening ? micOff : mic} slot="icon-only" />
    </IonButton>
  );
}

export function ConsumerAiSpeakReplyButton({
  text,
  locale,
  label,
  primaryColor,
}: {
  text: string;
  locale: string;
  label: string;
  primaryColor?: string;
}) {
  return (
    <IonButton
      size="small"
      fill="clear"
      style={{
        '--color': primaryColor ?? undefined,
        margin: '4px 0 0',
        height: 24,
        fontSize: 11,
      }}
      onClick={() => speakText(text, localeToSpeechLang(locale))}
    >
      <IonIcon icon={volumeHighOutline} slot="start" style={{ fontSize: 14 }} />
      {label}
    </IonButton>
  );
}
