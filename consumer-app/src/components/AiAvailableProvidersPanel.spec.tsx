import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiAvailableProvidersPanel } from './AiAvailableProvidersPanel.js';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';

describe('AiAvailableProvidersPanel', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('calls onSelectSlot with time when a slot button is pressed', async () => {
    const onSelectSlot = vi.fn();

    await act(async () => {
      root.render(
        <AiAvailableProvidersPanel
          providers={[{ id: 'emp-1', name: 'Mary', previewTimes: ['09:00'] }]}
          serviceName="Brows"
          date="2026-06-10"
          copy={CONSUMER_COPY_EN}
          onBook={vi.fn()}
          onSelectSlot={onSelectSlot}
        />,
      );
    });

    const slotButton = Array.from(container.querySelectorAll('ion-button')).find((btn) =>
      btn.textContent?.includes('09:00'),
    );
    expect(slotButton).toBeTruthy();

    await act(async () => {
      slotButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelectSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: expect.objectContaining({ id: 'emp-1', name: 'Mary' }),
        time: '09:00',
        prompt: 'Book Brows with Mary on 2026-06-10 at 09:00',
      }),
    );
  });
});
