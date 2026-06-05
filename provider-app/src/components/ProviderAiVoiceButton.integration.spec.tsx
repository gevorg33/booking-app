import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderAiVoiceButton } from './ProviderAiVoiceButton';

const voiceMock = vi.hoisted(() => ({
  isSupported: true,
  isListening: false,
  isNative: false,
  start: vi.fn(),
  stop: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock('../lib/use-provider-voice-input', () => ({
  useProviderVoiceInput: () => voiceMock,
}));

describe('ProviderAiVoiceButton integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    voiceMock.isSupported = true;
    voiceMock.isListening = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders voice button when supported', () => {
    act(() => {
      root.render(
        <ProviderAiVoiceButton
          labels={{ start: 'Start', stop: 'Stop' }}
          onTranscript={() => undefined}
        />,
      );
    });
    expect(container.querySelector('ion-button')).toBeTruthy();
  });

  it('renders nothing when voice is unsupported', () => {
    voiceMock.isSupported = false;
    act(() => {
      root.render(
        <ProviderAiVoiceButton
          labels={{ start: 'Start', stop: 'Stop' }}
          onTranscript={() => undefined}
        />,
      );
    });
    expect(container.querySelector('ion-button')).toBeNull();
  });

  it('toggles voice capture on click', () => {
    act(() => {
      root.render(
        <ProviderAiVoiceButton
          labels={{ start: 'Start', stop: 'Stop' }}
          onTranscript={() => undefined}
        />,
      );
    });
    act(() => container.querySelector('ion-button')!.click());
    expect(voiceMock.toggle).toHaveBeenCalled();
  });

  it('shows active listening state and respects disabled', () => {
    voiceMock.isListening = true;
    act(() => {
      root.render(
        <ProviderAiVoiceButton
          disabled
          labels={{ start: 'Start', stop: 'Stop' }}
          onTranscript={() => undefined}
        />,
      );
    });
    const button = container.querySelector('ion-button');
    expect(button?.className).toContain('ai-assistant-voice-btn--active');
    expect(button?.getAttribute('aria-label')).toBe('Stop');
  });
});
