import { useIonViewDidEnter, useIonViewDidLeave } from '@ionic/react';
import { useLayoutEffect, useState } from 'react';

export const SALON_TAB_ACTIVE_CLASS = 'salon-tab-active';

/** Ref-count body class so stacked IonPages don't clobber each other on leave/unmount. */
let salonTabActiveCount = 0;

/** Test-only: reset body class ref-count between specs. */
export function resetSalonTabActiveClassForTests(): void {
  salonTabActiveCount = 0;
  if (typeof document !== 'undefined') {
    document.body.classList.remove(SALON_TAB_ACTIVE_CLASS);
  }
}

export function acquireSalonTabActiveClass(): void {
  if (typeof document === 'undefined') return;
  salonTabActiveCount += 1;
  document.body.classList.add(SALON_TAB_ACTIVE_CLASS);
}

export function releaseSalonTabActiveClass(): void {
  if (typeof document === 'undefined') return;
  salonTabActiveCount = Math.max(0, salonTabActiveCount - 1);
  if (salonTabActiveCount === 0) {
    document.body.classList.remove(SALON_TAB_ACTIVE_CLASS);
  }
}

/**
 * Show portaled tab bar / FAB when this salon tab page is the active view.
 *
 * Defaults to visible on mount so hard loads / deep links get `salon-tab-active`
 * (and the fixed CTA offset) without waiting for Ionic `useIonViewDidEnter`,
 * which often does not fire on first paint (e2e-bug.2). Leave/enter still hide
 * overlays when Ionic keeps the page in the back stack.
 */
export function useSalonTabOverlaysVisible() {
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    if (!visible) return;
    acquireSalonTabActiveClass();
    return () => {
      releaseSalonTabActiveClass();
    };
  }, [visible]);

  useIonViewDidEnter(() => {
    setVisible((prev) => (prev ? prev : true));
  }, []);

  useIonViewDidLeave(() => {
    setVisible((prev) => (prev ? false : prev));
  }, []);

  return { overlaysVisible: visible };
}
