import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { AppLocale } from '@shared-i18n/types';
import {
  localeToSpeechLang,
  useSpeechRecognition,
  type SpeechRecognitionErrorCode,
} from './use-speech-recognition';
import { mergeProviderVoiceTranscript } from './provider-voice-input.util';

export type ProviderVoiceInputOptions = {
  locale?: AppLocale | string;
  inputValue?: string;
  onTranscript: (text: string) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
};

/**
 * Voice input for provider AI — Web Speech API in the WebView; same transcript pipeline as typing.
 * Native Capacitor speech plugins can be wired here later without changing the assistant UI.
 */
export function useProviderVoiceInput({
  locale,
  inputValue = '',
  onTranscript,
  onError,
}: ProviderVoiceInputOptions) {
  const voiceBaseRef = useRef('');

  const handleTranscript = useCallback(
    (text: string, meta: { isFinal: boolean }) => {
      const result = mergeProviderVoiceTranscript(voiceBaseRef.current, text, meta.isFinal);
      if (!result) return;
      onTranscript(result.merged);
      if (meta.isFinal) voiceBaseRef.current = result.nextBase;
    },
    [onTranscript],
  );

  const speech = useSpeechRecognition({
    lang: localeToSpeechLang(locale),
    onTranscript: handleTranscript,
    onError,
  });

  const startListening = useCallback(() => {
    if (!speech.isSupported) {
      onError?.('unsupported');
      return;
    }
    voiceBaseRef.current = inputValue.trim();
    speech.start();
  }, [inputValue, onError, speech]);

  const isNative = Capacitor.isNativePlatform();

  return {
    isSupported: speech.isSupported,
    isListening: speech.isListening,
    isNative,
    start: startListening,
    stop: speech.stop,
    toggle: () => {
      if (speech.isListening) speech.stop();
      else startListening();
    },
  };
}
