import { describe, expect, it } from 'vitest';
import {
  applyDocumentAccessibility,
  normalizeMobileA11yLocale,
  resolveConsumerDocumentLocale,
  resolveDocumentDirection,
} from './mobile-a11y.util.js';

describe('mobile-a11y.util (adopt-5.6)', () => {
  it('normalizes supported locales', () => {
    expect(normalizeMobileA11yLocale('hy-AM')).toBe('hy');
    expect(normalizeMobileA11yLocale('ru-RU')).toBe('ru');
    expect(normalizeMobileA11yLocale('fr')).toBe('en');
  });

  it('uses LTR direction for adoption locales', () => {
    expect(resolveDocumentDirection('hy')).toBe('ltr');
    expect(resolveDocumentDirection('ru')).toBe('ltr');
  });

  it('applies lang and adoption root class', () => {
    applyDocumentAccessibility('hy');
    expect(document.documentElement.lang).toBe('hy');
    expect(document.documentElement.dir).toBe('ltr');
    const root = document.body ?? document.documentElement;
    expect(root?.classList?.contains('adoption-a11y-root')).toBe(true);
  });

  it('resolves consumer locale from path or navigator', () => {
    expect(resolveConsumerDocumentLocale()).toBeTruthy();
  });
});
