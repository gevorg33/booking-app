import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderBottomTabBar } from './ProviderBottomTabBar';

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('ProviderBottomTabBar (e2e-bug.65)', () => {
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

  it('renders clinic tabs including Profile when lab collection is enabled', () => {
    act(() => {
      root.render(
        <ProviderBottomTabBar
          activeTab="today"
          showLabCollection
          onOpenTab={() => undefined}
        />,
      );
    });

    const nav = container.querySelector('.provider-bottom-tab-bar');
    expect(nav).toBeTruthy();
    const buttons = container.querySelectorAll('.provider-tab-btn');
    expect(buttons).toHaveLength(9);
    expect(container.textContent).toContain('provider.navProfile');
  });

  it('scrolls the active tab into view when clinic tabs overflow', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    act(() => {
      root.render(
        <ProviderBottomTabBar
          activeTab="profile"
          showLabCollection
          onOpenTab={() => undefined}
        />,
      );
    });

    expect(scrollIntoView).toHaveBeenCalled();
    const active = container.querySelector('.provider-tab-btn.is-active');
    expect(active?.textContent).toContain('provider.navProfile');
  });
});
