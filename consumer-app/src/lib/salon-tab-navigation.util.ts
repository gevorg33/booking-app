import { Capacitor } from '@capacitor/core';
import type { History } from 'history';
import type { ConsumerIonRouter } from './consumer-ion-navigation.util.js';
import { buildSalonTabHomePath, type SalonTabId } from './salon-tab-route.util.js';

/** Navigate to a salon tab without stacking duplicate IonPages on Android. */
export function navigateToSalonTab(
  history: History,
  slug: string,
  tab: SalonTabId,
  ionRouter?: ConsumerIonRouter,
  options?: { replace?: boolean },
): void {
  const base = `/s/${slug}`;
  const path =
    tab === 'home'
      ? buildSalonTabHomePath(slug)
      : tab === 'services'
        ? `${base}/services`
        : tab === 'account'
          ? `${base}/account`
          : tab === 'results'
            ? `${base}/results`
            : tab === 'lab-to-book'
              ? `${base}/lab-to-book`
              : `${base}/lab-requests`;

  const replace = options?.replace !== false;

  if (Capacitor.isNativePlatform() && ionRouter) {
    ionRouter.push(path, 'back', replace ? 'replace' : 'push');
    return;
  }

  if (replace) {
    history.replace(path);
    return;
  }
  history.push(path);
}
