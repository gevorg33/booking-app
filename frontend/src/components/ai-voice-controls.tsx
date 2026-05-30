'use client';

import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
import {
  localeToSpeechLang,
  speakText,
  useSpeechRecognition,
  type SpeechRecognitionErrorCode,
} from '@/lib/use-speech-recognition';
import type { AppLocale } from '@/i18n/types';

interface AiVoiceInputButtonProps {
  disabled?: boolean;
  inputValue?: string;
  locale?: AppLocale | string;
  onTranscript: (text: string) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
  variant?: 'dark' | 'light';
  primaryColor?: string;
  labels: {
    start: string;
    stop: string;
  };
}

export function AiVoiceInputButton({
  disabled = false,
  inputValue = '',
  locale,
  onTranscript,
  onError,
  variant = 'dark',
  primaryColor,
  labels,
}: AiVoiceInputButtonProps) {
  const voiceBaseRef = useRef('');

  const handleTranscript = useCallback(
    (text: string, meta: { isFinal: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed && !meta.isFinal) return;

      const merged = voiceBaseRef.current
        ? `${voiceBaseRef.current} ${trimmed}`.trim()
        : trimmed;

      onTranscript(merged);

      if (meta.isFinal) {
        voiceBaseRef.current = merged;
      }
    },
    [onTranscript],
  );

  const { isSupported, isListening, start, stop } = useSpeechRecognition({
    lang: localeToSpeechLang(locale),
    onTranscript: handleTranscript,
    onError,
  });

  const handleClick = () => {
    if (!isSupported || disabled) return;
    if (!isListening) {
      voiceBaseRef.current = inputValue.trim();
      start();
      return;
    }
    stop();
  };

  if (!isSupported) return null;

  const dark = variant === 'dark';
  const activeStyle =
    !dark && primaryColor
      ? { backgroundColor: primaryColor, color: '#fff' }
      : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isListening ? labels.stop : labels.start}
      aria-label={isListening ? labels.stop : labels.start}
      aria-pressed={isListening}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
        isListening
          ? dark
            ? 'bg-red-600/90 hover:bg-red-500 text-white'
            : 'text-white'
          : dark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
      }`}
      style={isListening && !dark ? activeStyle : undefined}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}

interface AiSpeakReplyButtonProps {
  text: string;
  locale?: AppLocale | string;
  label: string;
  variant?: 'dark' | 'light';
  primaryColor?: string;
}

export function AiSpeakReplyButton({
  text,
  locale,
  label,
  variant = 'dark',
  primaryColor,
}: AiSpeakReplyButtonProps) {
  const handleSpeak = () => {
    if (!text.trim()) return;
    speakText(text, localeToSpeechLang(locale));
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={label}
      aria-label={label}
      className={`mt-1.5 inline-flex items-center gap-1 text-[10px] transition-colors ${
        variant === 'dark'
          ? 'text-gray-500 hover:text-gray-300'
          : 'text-gray-400 hover:text-gray-700'
      }`}
      style={variant === 'light' && primaryColor ? { color: primaryColor } : undefined}
    >
      <Volume2 className="w-3 h-3" />
      {label}
    </button>
  );
}
