import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTranscriptFromResults,
  getSpeechRecognitionCtor,
  localeToSpeechLang,
  useSpeechRecognition,
} from './use-speech-recognition';

type MockRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  onresult: ((event: { resultIndex: number; results: Array<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function SpeechHarness({
  lang,
  onTranscript,
  onError,
}: {
  lang?: string;
  onTranscript: (text: string, meta: { isFinal: boolean }) => void;
  onError?: (code: string) => void;
}) {
  const speech = useSpeechRecognition({ lang, onTranscript, onError });
  return (
    <div>
      <span data-testid="supported">{String(speech.isSupported)}</span>
      <span data-testid="listening">{String(speech.isListening)}</span>
      <button type="button" onClick={() => speech.start()}>
        start
      </button>
      <button type="button" onClick={() => speech.stop()}>
        stop
      </button>
      <button type="button" onClick={() => speech.toggle()}>
        toggle
      </button>
    </div>
  );
}

describe('use-speech-recognition', () => {
  let container: HTMLDivElement;
  let root: Root;
  let transcripts: Array<{ text: string; isFinal: boolean }>;
  let errors: string[];
  let instances: MockRecognition[];

  beforeEach(() => {
    transcripts = [];
    errors = [];
    instances = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    class MockSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start = vi.fn(() => {
        const self = this as MockRecognition;
        instances.push(self);
      });
      stop = vi.fn(() => {
        const self = this as MockRecognition;
        self.onend?.();
      });
      abort = vi.fn();
    }

    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function mount(lang = 'en-US') {
    act(() => {
      root.render(
        <SpeechHarness
          lang={lang}
          onTranscript={(text, meta) => transcripts.push({ text, isFinal: meta.isFinal })}
          onError={(code) => errors.push(code)}
        />,
      );
    });
  }

  function click(label: 'start' | 'stop' | 'toggle') {
    const buttons = Array.from(container.querySelectorAll('button'));
    const idx = label === 'start' ? 0 : label === 'stop' ? 1 : 2;
    act(() => buttons[idx].click());
  }

  it('maps app locales to speech recognition langs', () => {
    expect(localeToSpeechLang('en')).toBe('en-US');
    expect(localeToSpeechLang('hy')).toBe('hy-AM');
    expect(localeToSpeechLang('ru')).toBe('ru-RU');
  });

  it('builds transcript text from recognition results', () => {
    expect(buildTranscriptFromResults([])).toBe('');
    expect(
      buildTranscriptFromResults([
        { isFinal: true, 0: { transcript: 'hello' } },
        { isFinal: false, 0: { transcript: 'world' } },
        { isFinal: true, 0: { transcript: '   ' } },
        { isFinal: true } as { isFinal: boolean; 0: { transcript: string } },
      ]),
    ).toBe('hello world');
    expect(getSpeechRecognitionCtor()).toBeTruthy();
  });

  it('returns null speech ctor without window', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error test server-side guard
    delete globalThis.window;
    expect(getSpeechRecognitionCtor()).toBeNull();
    globalThis.window = originalWindow;
  });

  it('starts listening and streams interim transcripts', () => {
    mount();
    click('start');
    const recognition = instances.at(-1)!;
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: false, 0: { transcript: 'mark all' } }],
      });
    });
    expect(transcripts).toEqual([{ text: 'mark all', isFinal: false }]);
  });

  it('finishes session on user stop with final transcript', () => {
    mount();
    click('start');
    const recognition = instances.at(-1)!;
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: false, 0: { transcript: 'paid' } }],
      });
    });
    click('stop');
    expect(transcripts.at(-1)).toEqual({ text: 'paid', isFinal: true });
  });

  it('maps recognition errors and ignores aborted/no-speech on stop', () => {
    mount();
    click('start');
    const recognition = instances.at(-1)!;
    act(() => recognition.onerror?.({ error: 'aborted' }));
    expect(errors).toEqual([]);
    click('stop');
    act(() => recognition.onerror?.({ error: 'no-speech' }));
    expect(errors).toEqual([]);

    act(() => recognition.onerror?.({ error: 'not-allowed' }));
    expect(errors).toContain('not-allowed');
    click('start');
    act(() => instances.at(-1)!.onerror?.({ error: 'service-not-allowed' }));
    expect(errors).toContain('not-allowed');
    click('start');
    act(() => instances.at(-1)!.onerror?.({ error: 'network' }));
    expect(errors).toContain('network');
    click('start');
    act(() => instances.at(-1)!.onerror?.({ error: 'audio-capture' }));
    expect(errors).toContain('unknown');
    click('start');
    act(() => instances.at(-1)!.onerror?.({ error: 'no-speech' }));
    expect(errors.filter((e) => e === 'no-speech')).toHaveLength(0);
  });

  it('restarts listening until user stops or restart fails', () => {
    mount();
    click('start');
    const recognition = instances.at(-1)!;
    recognition.start.mockImplementationOnce(() => {
      throw new Error('busy');
    });
    act(() => recognition.onend?.());
    expect(container.querySelector('[data-testid="listening"]')?.textContent).toBe('false');

    click('start');
    const retry = instances.at(-1)!;
    act(() => retry.onend?.());
    expect(retry.start).toHaveBeenCalledTimes(2);
  });

  it('reports unsupported platform and handles start failures', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    mount();
    expect(container.querySelector('[data-testid="supported"]')?.textContent).toBe('false');
    click('start');
    expect(errors).toEqual(['unsupported']);

    class FailingStart {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start = vi.fn(() => {
        throw new Error('denied');
      });
      stop = vi.fn();
      abort = vi.fn();
    }
    vi.stubGlobal('SpeechRecognition', FailingStart);
    mount();
    click('start');
    expect(errors).toContain('unknown');
  });

  it('uses webkit speech recognition when standard API is missing', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    class WebkitRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
    }
    vi.stubGlobal('webkitSpeechRecognition', WebkitRecognition);
    mount();
    expect(container.querySelector('[data-testid="supported"]')?.textContent).toBe('true');
  });

  it('ignores stop before a session starts', () => {
    mount();
    click('stop');
    expect(instances).toHaveLength(0);
  });

  it('ignores no-speech errors while the user is stopping', () => {
    mount();
    click('start');
    const recognition = instances.at(-1)!;
    recognition.stop.mockImplementation(() => undefined);
    click('stop');
    act(() => recognition.onerror?.({ error: 'no-speech' }));
    expect(errors).toEqual([]);
  });

  it('toggles listening and cleans up on unmount', () => {
    mount();
    click('toggle');
    expect(instances.at(-1)?.start).toHaveBeenCalled();
    click('toggle');
    expect(instances.at(-1)?.stop).toHaveBeenCalled();
    const abortSpy = instances.at(-1)!.abort;
    act(() => root.unmount());
    expect(abortSpy).toHaveBeenCalled();
  });
});
