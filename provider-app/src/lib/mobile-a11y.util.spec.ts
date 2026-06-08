import { describe, expect, it } from 'vitest';
import {
  applyDocumentAccessibility,
  normalizeMobileA11yLocale,
  resolveDocumentDirection,
} from './mobile-a11y.util';

describe('mobile-a11y.util (adopt-5.6)', () => {
  it('normalizes supported locales', () => {
    expect(normalizeMobileA11yLocale('hy-AM')).toBe('hy');
    expect(normalizeMobileA11yLocale('ru-RU')).toBe('ru');
  });

  it('uses LTR direction for adoption locales', () => {
    expect(resolveDocumentDirection('en')).toBe('ltr');
  });

  it('applies lang and adoption root class', () => {
    applyDocumentAccessibility('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(document.body.classList.contains('adoption-a11y-root')).toBe(true);
  });
});
