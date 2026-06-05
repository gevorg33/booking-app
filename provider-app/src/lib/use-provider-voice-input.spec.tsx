import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProviderVoiceInput } from './use-provider-voice-input';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

const speechState = vi.hoisted(() => ({
  isSupported: true,
  isListening: false,
  start: vi.fn(),
  stop: vi.fn(),
  onTranscript: null as ((text: string, meta: { isFinal: boolean }) => void) | null,
}));

vi.mock('./use-speech-recognition', () => ({
  localeToSpeechLang: (locale?: string) => (locale === 'hy' ? 'hy-AM' : 'en-US'),
  useSpeechRecognition: (opts: {
    onTranscript: (text: string, meta: { isFinal: boolean }) => void;
  }) => {
    speechState.onTranscript = opts.onTranscript;
    return speechState;
  },
}));

function VoiceHarness({
  inputValue,
  onTranscript,
  onError,
}: {
  inputValue: string;
  onTranscript: (text: string) => void;
  onError?: (code: string) => void;
}) {
  const voice = useProviderVoiceInput({ locale: 'en', inputValue, onTranscript, onError });
  return (
    <div>
      <span data-testid="native">{String(voice.isNative)}</span>
      <button type="button" onClick={() => voice.start()}>
        start
      </button>
      <button type="button" onClick={() => voice.toggle()}>
        toggle
      </button>
      <button type="button" onClick={() => voice.stop()}>
        stop
      </button>
    </div>
  );
}

describe('useProviderVoiceInput', () => {
  let container: HTMLDivElement;
  let root: Root;
  let transcript: string | null;
  let errorCode: string | null;

  beforeEach(() => {
    transcript = null;
    errorCode = null;
    speechState.isSupported = true;
    speechState.isListening = false;
    speechState.start.mockClear();
    speechState.stop.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function mount(inputValue = 'seed') {
    act(() => {
      root.render(
        <VoiceHarness
          inputValue={inputValue}
          onTranscript={(text) => {
            transcript = text;
          }}
          onError={(code) => {
            errorCode = code;
          }}
        />,
      );
    });
  }

  it('starts listening when supported', () => {
    mount('hello');
    act(() => container.querySelector('button')!.click());
    expect(speechState.start).toHaveBeenCalled();
  });

  it('merges transcript chunks into assistant input', () => {
    mount('hello');
    act(() => container.querySelectorAll('button')[0].click());
    act(() => speechState.onTranscript?.('   ', { isFinal: false }));
    expect(transcript).toBeNull();
    act(() => speechState.onTranscript?.('world', { isFinal: true }));
    expect(transcript).toBe('hello world');
  });

  it('stops listening via stop handler', () => {
    mount();
    act(() => container.querySelectorAll('button')[2].click());
    expect(speechState.stop).toHaveBeenCalled();
  });

  it('reports unsupported and toggles stop/start', () => {
    speechState.isSupported = false;
    mount();
    const buttons = container.querySelectorAll('button');
    act(() => buttons[0].click());
    expect(errorCode).toBe('unsupported');

    speechState.isSupported = true;
    speechState.isListening = true;
    mount();
    act(() => container.querySelectorAll('button')[1].click());
    expect(speechState.stop).toHaveBeenCalled();

    speechState.isListening = false;
    mount();
    act(() => container.querySelectorAll('button')[1].click());
    expect(speechState.start).toHaveBeenCalled();
  });
});
