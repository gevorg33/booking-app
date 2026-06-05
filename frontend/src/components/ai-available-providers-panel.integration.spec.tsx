import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AiAvailableProvidersPanel } from './ai-available-providers-panel';

describe('AiAvailableProvidersPanel integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let bookedPrompt: string | null;

  beforeEach(() => {
    bookedPrompt = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function mountPanel(
    props: Partial<Parameters<typeof AiAvailableProvidersPanel>[0]> = {},
  ) {
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiAvailableProvidersPanel
            providers={[
              {
                id: 'emp-1',
                name: 'Karo Mazmanyan',
                role: 'Cosmetologist',
                previewTimes: ['14:00', '14:30'],
              },
            ]}
            serviceName="Permanent lips"
            date="2026-06-06"
            onBook={(prompt) => {
              bookedPrompt = prompt;
            }}
            {...props}
          />
        </I18nProvider>,
      );
      await Promise.resolve();
    });
  }

  it('renders provider rows with times and book action', async () => {
    await mountPanel();

    expect(container.textContent).toContain('Available providers');
    expect(container.textContent).toContain('Karo Mazmanyan');
    expect(container.textContent).toContain('Cosmetologist');
    expect(container.textContent).toContain('14:00, 14:30');
    expect(container.textContent).toContain('Book');
  });

  it('submits a booking prompt when a provider is clicked', async () => {
    await mountPanel();

    const button = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      button.click();
    });

    expect(bookedPrompt).toBe(
      'Book Permanent lips with Karo Mazmanyan on 2026-06-06 at 14:00',
    );
  });

  it('renders nothing when the provider list is empty', async () => {
    await mountPanel({ providers: [] });

    expect(container.textContent?.trim()).toBe('');
  });

  it('renders provider without times when only a name is known', async () => {
    await mountPanel({
      providers: [{ name: 'Mary Torgomyan' }],
      serviceName: 'Massage',
      date: undefined,
    });

    expect(container.textContent).toContain('Mary Torgomyan');
    expect(container.textContent).not.toContain('14:00');

    const button = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      button.click();
    });

    expect(bookedPrompt).toBe('Book Massage with Mary Torgomyan');
  });
});
