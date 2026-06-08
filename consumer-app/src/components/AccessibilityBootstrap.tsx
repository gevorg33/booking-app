import { useEffect } from 'react';
import {
  applyDocumentAccessibility,
  resolveConsumerDocumentLocale,
} from '../lib/mobile-a11y.util.js';

/** Sets document lang/dir for screen readers and RTL-safe layout (adopt-5.6). */
export function AccessibilityBootstrap() {
  useEffect(() => {
    const apply = () => applyDocumentAccessibility(resolveConsumerDocumentLocale());
    apply();
    window.addEventListener('popstate', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('popstate', apply);
      window.removeEventListener('storage', apply);
    };
  }, []);

  return null;
}
