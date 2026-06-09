// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MOBILE_A11Y_CSS_VARS,
  MOBILE_A11Y_HIT_TARGET_MIN_REM,
  MOBILE_A11Y_ROOT_CLASS,
} from '../lib/mobile-a11y.util';
import { AccessibilityBootstrap } from './AccessibilityBootstrap';

const localeState = vi.hoisted(() => ({ locale: 'en' as 'en' | 'hy' | 'ru' }));

vi.mock('../i18n', () => ({
  useI18n: () => ({ locale: localeState.locale, t: (key: string) => key }),
}));

describe('AccessibilityBootstrap integration (prov-exp-10.3)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localeState.locale = 'en';
    document.body.classList.remove(MOBILE_A11Y_ROOT_CLASS);
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    document.documentElement.style.removeProperty(MOBILE_A11Y_CSS_VARS.fontScale);
    document.documentElement.style.removeProperty(MOBILE_A11Y_CSS_VARS.hitTargetMin);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('applies document accessibility on mount', () => {
    act(() => {
      root.render(<AccessibilityBootstrap />);
    });

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains(MOBILE_A11Y_ROOT_CLASS)).toBe(true);
    expect(document.documentElement.style.getPropertyValue(MOBILE_A11Y_CSS_VARS.hitTargetMin)).toBe(
      `${MOBILE_A11Y_HIT_TARGET_MIN_REM}rem`,
    );
  });

  it('updates lang when provider locale changes', () => {
    act(() => {
      root.render(<AccessibilityBootstrap />);
    });
    expect(document.documentElement.lang).toBe('en');

    localeState.locale = 'hy';
    act(() => {
      root.render(<AccessibilityBootstrap />);
    });
    expect(document.documentElement.lang).toBe('hy');
  });
});
