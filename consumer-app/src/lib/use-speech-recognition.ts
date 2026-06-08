import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConsumerLocale } from './tenant-locale.js';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function buildTranscriptFromResults(results: SpeechRecognitionEventLike['results']): string {
  const finals: string[] = [];
  let interim = '';

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    const transcript = result[0]?.transcript?.trim() ?? '';
    if (!transcript) continue;
    if (result.isFinal) finals.push(transcript);
    else interim = transcript;
  }

  return [finals.join(' '), interim].filter(Boolean).join(' ').trim();
}

export function localeToSpeechLang(locale?: ConsumerLocale | string): string {
  if (locale === 'hy') return 'hy-AM';
  if (locale === 'ru') return 'ru-RU';
  return 'en-US';
}

export type SpeechRecognitionErrorCode =
  | 'unsupported'
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'unknown';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onTranscript: (text: string, meta: { isFinal: boolean }) => void;
  onError?: (code: SpeechRecognitionErrorCode) => void;
}

export function useSpeechRecognition({
  lang = 'en-US',
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => getSpeechRecognitionCtor() != null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const callbacksRef = useRef({ onTranscript, onError });
  const sessionTextRef = useRef('');
  const userStoppedRef = useRef(false);
  const keepListeningRef = useRef(false);

  callbacksRef.current = { onTranscript, onError };

  const finishSession = useCallback(() => {
    keepListeningRef.current = false;
    setIsListening(false);
    const text = sessionTextRef.current.trim();
    if (text) {
      callbacksRef.current.onTranscript(text, { isFinal: true });
    }
    sessionTextRef.current = '';
    userStoppedRef.current = false;
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    userStoppedRef.current = true;
    keepListeningRef.current = false;
    recognitionRef.current.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacksRef.current.onError?.('unsupported');
      return;
    }

    recognitionRef.current?.abort();

    sessionTextRef.current = '';
    userStoppedRef.current = false;
    keepListeningRef.current = true;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = buildTranscriptFromResults(event.results);
      sessionTextRef.current = text;
      if (text) {
        callbacksRef.current.onTranscript(text, { isFinal: false });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech' && userStoppedRef.current) return;

      const code: SpeechRecognitionErrorCode =
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'not-allowed'
          : event.error === 'no-speech'
            ? 'no-speech'
            : event.error === 'network'
              ? 'network'
              : 'unknown';

      if (code !== 'no-speech') {
        callbacksRef.current.onError?.(code);
      }

      keepListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (userStoppedRef.current) {
        finishSession();
        return;
      }

      if (keepListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch {
          keepListeningRef.current = false;
        }
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      keepListeningRef.current = false;
      setIsListening(false);
      callbacksRef.current.onError?.('unknown');
    }
  }, [finishSession, lang]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return { isSupported, isListening, start, stop, toggle };
}

export function speakText(text: string, lang = 'en-US'): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
