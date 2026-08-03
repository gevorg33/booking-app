/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E2_LIVE_CASES,
  E2E2_SALON_TAB_ACTIVE_CLASS,
} from './e2e2-salon-tab-active.fixtures.js';
import {
  acquireSalonTabActiveClass,
  releaseSalonTabActiveClass,
  resetSalonTabActiveClassForTests,
  SALON_TAB_ACTIVE_CLASS,
  useSalonTabOverlaysVisible,
} from './use-salon-tab-overlays-visible.js';

const didEnterCallbacks: Array<() => void> = [];
const didLeaveCallbacks: Array<() => void> = [];

vi.mock('@ionic/react', () => ({
  useIonViewDidEnter: (cb: () => void) => {
    didEnterCallbacks.push(cb);
  },
  useIonViewDidLeave: (cb: () => void) => {
    didLeaveCallbacks.push(cb);
  },
}));

function HookProbe({ onRender }: { onRender: (visible: boolean) => void }) {
  const { overlaysVisible } = useSalonTabOverlaysVisible();
  onRender(overlaysVisible);
  return null;
}

describe('salon-tab-active body class (e2e-bug.2)', () => {
  beforeEach(() => {
    resetSalonTabActiveClassForTests();
    didEnterCallbacks.length = 0;
    didLeaveCallbacks.length = 0;
  });

  afterEach(() => {
    resetSalonTabActiveClassForTests();
  });

  it('acquire/release ref-counts the body class', () => {
    acquireSalonTabActiveClass();
    acquireSalonTabActiveClass();
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(true);
    releaseSalonTabActiveClass();
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(true);
    releaseSalonTabActiveClass();
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(false);
  });

  it('is active on mount without waiting for IonViewDidEnter (hard load)', () => {
    let visible: boolean | null = null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root;

    act(() => {
      root = createRoot(container);
      root.render(<HookProbe onRender={(v) => { visible = v; }} />);
    });

    expect(visible).toBe(true);
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(true);

    act(() => {
      root!.unmount();
    });
    container.remove();
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(false);
  });

  it('hides overlays and clears class on IonViewDidLeave, restores on DidEnter', () => {
    let visible: boolean | null = null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root;

    act(() => {
      root = createRoot(container);
      root.render(<HookProbe onRender={(v) => { visible = v; }} />);
    });

    expect(didLeaveCallbacks.length).toBe(1);
    expect(didEnterCallbacks.length).toBe(1);

    act(() => {
      didLeaveCallbacks[0]!();
    });
    expect(visible).toBe(false);
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(false);

    act(() => {
      didEnterCallbacks[0]!();
    });
    expect(visible).toBe(true);
    expect(document.body.classList.contains(SALON_TAB_ACTIVE_CLASS)).toBe(true);

    act(() => {
      root!.unmount();
    });
    container.remove();
  });

  it('fixture class name matches hook export', () => {
    expect(E2E2_SALON_TAB_ACTIVE_CLASS).toBe(SALON_TAB_ACTIVE_CLASS);
  });

  it('documents live guru scenarios', () => {
    expect(E2E2_LIVE_CASES.map((c) => c.id)).toEqual([
      'cold-hard-load-home',
      'cold-hard-load-services',
      'warm-tab-switch-account-then-home',
      'tab-bar-visible-cold',
      'ai-fab-not-under-tab-bar',
    ]);
  });
});
