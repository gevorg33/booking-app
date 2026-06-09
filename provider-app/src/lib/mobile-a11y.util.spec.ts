import { describe, expect, it } from 'vitest';
import {
  MOBILE_A11Y_CSS_VARS,
  MOBILE_A11Y_FONT_SCALE_DEFAULT,
  MOBILE_A11Y_HIT_TARGET_MIN_REM,
  MOBILE_A11Y_ROOT_CLASS,
  applyDocumentAccessibility,
  normalizeMobileA11yLocale,
  resolveDocumentDirection,
  resolveMobileFontScale,
} from './mobile-a11y.util';

describe('mobile-a11y.util (adopt-5.6 / prov-exp-10.3)', () => {
  it('normalizes supported locales', () => {
    expect(normalizeMobileA11yLocale('hy-AM')).toBe('hy');
    expect(normalizeMobileA11yLocale('ru-RU')).toBe('ru');
    expect(normalizeMobileA11yLocale('fr')).toBe('en');
  });

  it('uses LTR direction for adoption locales', () => {
    expect(resolveDocumentDirection('en')).toBe('ltr');
    expect(resolveDocumentDirection('hy')).toBe('ltr');
  });

  it('exposes font scale and hit target defaults', () => {
    expect(resolveMobileFontScale()).toBe(MOBILE_A11Y_FONT_SCALE_DEFAULT);
    expect(MOBILE_A11Y_HIT_TARGET_MIN_REM).toBeGreaterThanOrEqual(2.75);
  });

  it('applies lang, css vars, and adoption root class', () => {
    document.body.classList.remove(MOBILE_A11Y_ROOT_CLASS);
    applyDocumentAccessibility('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains(MOBILE_A11Y_ROOT_CLASS)).toBe(true);
    expect(document.documentElement.style.getPropertyValue(MOBILE_A11Y_CSS_VARS.fontScale)).toBe(
      String(MOBILE_A11Y_FONT_SCALE_DEFAULT),
    );
    expect(document.documentElement.style.getPropertyValue(MOBILE_A11Y_CSS_VARS.hitTargetMin)).toBe(
      `${MOBILE_A11Y_HIT_TARGET_MIN_REM}rem`,
    );
  });
});
