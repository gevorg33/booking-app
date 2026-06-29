import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import type { AiGuideResponse } from '@/lib/ai-client.types';
import { AiGuideStepsPanel } from './ai-guide-steps-panel';

const sampleGuide: AiGuideResponse = {
  summary: 'Set up your weekly schedule.',
  topicId: 'dashboard.core.schedule',
  navigate: { path: '/dashboard/schedule' },
  steps: [
    {
      title: 'Open Schedule',
      body: 'Go to Schedule in the sidebar.',
      navigate: { path: '/dashboard/schedule' },
    },
    { title: 'Apply template', body: 'Pick a weekday template and apply it.' },
  ],
};

describe('AiGuideStepsPanel integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let navigatedUrl: string | null;

  beforeEach(() => {
    navigatedUrl = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function mountPanel(guide: AiGuideResponse = sampleGuide) {
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiGuideStepsPanel
            guide={guide}
            onNavigate={(url) => {
              navigatedUrl = url;
            }}
          />
        </I18nProvider>,
      );
      await Promise.resolve();
    });
  }

  it('renders summary, numbered steps, and the first step body', async () => {
    await mountPanel();

    expect(container.textContent).toContain('Set up your weekly schedule.');
    expect(container.textContent).toContain('Step 1 of 2');
    expect(container.textContent).toContain('Open Schedule');
    expect(container.textContent).toContain('Go to Schedule in the sidebar.');
    expect(container.textContent).toContain('Apply template');
  });

  it('advances to the next step', async () => {
    await mountPanel();

    const nextButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Next step'),
    );
    act(() => {
      nextButton?.click();
    });

    expect(container.textContent).toContain('Step 2 of 2');
    expect(container.textContent).toContain('Pick a weekday template and apply it.');
  });

  it('opens the in-app destination from the active step', async () => {
    await mountPanel();

    const openButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Open in app'),
    );
    act(() => {
      openButton?.click();
    });

    expect(navigatedUrl).toBe('/dashboard/schedule');
  });

  it('links to the full guide topic when topicId is present', async () => {
    await mountPanel();

    const fullGuideLink = Array.from(container.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('View full guide'),
    );
    expect(fullGuideLink?.getAttribute('href')).toBe('/dashboard/guide#schedule');
  });

  it('shows Do this for me handoffs on the final step', async () => {
    let handoffLabel: string | null = null;
    await act(async () => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiGuideStepsPanel
            guide={{
              ...sampleGuide,
              relatedActions: [
                {
                  action: 'apply_schedule',
                  label: 'Apply a schedule template',
                  prompt: 'Apply the weekday schedule template',
                },
              ],
            }}
            onNavigate={() => undefined}
            onHandoff={(related) => {
              handoffLabel = related.label;
            }}
          />
        </I18nProvider>,
      );
      await Promise.resolve();
    });

    const nextButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Next step'),
    );
    act(() => {
      nextButton?.click();
    });

    const handoffButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Do this for me'),
    );
    act(() => {
      handoffButton?.click();
    });
    expect(handoffLabel).toBe('Apply a schedule template');
  });
});
