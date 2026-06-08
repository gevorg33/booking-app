import { useEffect } from 'react';
import { useI18n } from '../i18n';
import { applyDocumentAccessibility, normalizeMobileA11yLocale } from '../lib/mobile-a11y.util';

/** Sets document lang/dir for screen readers and RTL-safe layout (adopt-5.6). */
export function AccessibilityBootstrap() {
  const { locale } = useI18n();

  useEffect(() => {
    applyDocumentAccessibility(normalizeMobileA11yLocale(locale));
  }, [locale]);

  return null;
}
