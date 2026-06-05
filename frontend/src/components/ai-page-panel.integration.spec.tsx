import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AiPagePanel } from './ai-page-panel';
import { getAiPageContext, clearAiPageContext } from '@/lib/ai-orchestration';

describe('AiPagePanel integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let dispatched: string | null;
  let customSelected: string | null;

  beforeEach(() => {
    dispatched = null;
    customSelected = null;
    clearAiPageContext();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.addEventListener('orchestrix:prompt', ((e: CustomEvent) => {
      dispatched = e.detail?.prompt ?? null;
    }) as EventListener);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    clearAiPageContext();
  });

  function mountPanel(props: Partial<Parameters<typeof AiPagePanel>[0]> = {}) {
    act(() => {
      root.render(
        <I18nProvider initialLocale="en">
          <AiPagePanel context={{ route: '/dashboard/customers' }} {...props} />
        </I18nProvider>,
      );
    });
  }

  function clickButtonMatching(matcher: RegExp) {
    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      matcher.test(b.textContent ?? ''),
    );
    expect(btn).toBeTruthy();
    act(() => btn!.click());
  }

  it('renders grouped customer prompts and dispatches orchestrix event', () => {
    mountPanel();
    clickButtonMatching(/Orchestrix|Customer|AI/i);
    clickButtonMatching(/Retention/i);
    clickButtonMatching(/no-show/i);
    expect(dispatched).toMatch(/no-show/i);
  });

  it('uses onboarding step groups on onboarding route', () => {
    mountPanel({
      context: { route: '/dashboard/onboarding' },
      onboardingStep: 'link',
      title: 'Setup AI',
    });
    expect(container.textContent).toMatch(/Setup AI/i);
    clickButtonMatching(/Setup AI/i);
    clickButtonMatching(/booking link/i);
    expect(dispatched).toMatch(/booking link/i);
  });

  it('calls onSelectPrompt instead of dispatching event', () => {
    mountPanel({
      suggestions: ['Manual prompt'],
      context: undefined,
      onSelectPrompt: (p) => {
        customSelected = p;
      },
    });
    clickButtonMatching(/Orchestrix|Quick|AI/i);
    clickButtonMatching(/Manual prompt/);
    expect(customSelected).toBe('Manual prompt');
    expect(dispatched).toBeNull();
  });

  it('sets and clears page context from route prop', () => {
    mountPanel({
      context: { route: '/dashboard/reports', dateFrom: 'Jan 1', dateTo: 'Jan 31' },
    });
    expect(getAiPageContext().route).toBe('/dashboard/reports');
    expect(getAiPageContext().dateFrom).toBe('Jan 1');
    act(() => root.unmount());
    expect(getAiPageContext().route).toBeUndefined();
  });

  it('returns null when there are no suggestions', () => {
    mountPanel({ context: { route: '' }, suggestions: [] });
    expect(container.innerHTML).toBe('');
  });
});
