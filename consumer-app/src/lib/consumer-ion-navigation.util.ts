import { Capacitor } from '@capacitor/core';
import type { History } from 'history';

/** Minimal ion router surface — matches `useIonRouter()`. */
export type ConsumerIonRouter = {
  push: (
    pathname: string,
    routerDirection?: 'forward' | 'back' | 'root',
    routeAction?: 'push' | 'replace' | 'pop',
  ) => void;
  goBack?: () => void;
  canGoBack?: () => boolean;
};

const SALON_TAB_PATH =
  /^\/s\/[^/]+\/(home|services|account|results|lab-to-book|lab-requests)$/;

export function isSalonTabPath(path: string): boolean {
  return SALON_TAB_PATH.test(path.split('?')[0] ?? path);
}

/** Sync React Router after Ionic navigation so useLocation() gets search params. */
export function syncConsumerRouteHistory(
  history: History,
  path: string,
  state?: unknown,
): void {
  history.replace(path, state);
}

/** Push a route and keep Ionic's native stack in sync on Android. */
export function pushConsumerRoute(
  history: History,
  ionRouter: ConsumerIonRouter | undefined,
  path: string,
  state?: unknown,
): void {
  if (Capacitor.isNativePlatform() && ionRouter) {
    ionRouter.push(path, 'forward', 'push');
    return;
  }
  history.push(path, state);
}

/** Replace current route — keeps Ionic stack aligned on Android. */
export function replaceConsumerRoute(
  history: History,
  ionRouter: ConsumerIonRouter | undefined,
  path: string,
  state?: unknown,
): void {
  if (Capacitor.isNativePlatform() && ionRouter) {
    ionRouter.push(path, 'root', 'replace');
    syncConsumerRouteHistory(history, path, state);
    return;
  }
  history.replace(path, state);
}

/** Pop or replace back — keeps Ionic stack aligned with React Router on Android. */
export function backConsumerRoute(
  history: History,
  ionRouter: ConsumerIonRouter | undefined,
  defaultHref: string,
): void {
  const toTab = isSalonTabPath(defaultHref);

  if (Capacitor.isNativePlatform() && ionRouter) {
    if (toTab) {
      ionRouter.push(defaultHref, 'back', 'replace');
      syncConsumerRouteHistory(history, defaultHref);
      return;
    }
    if (ionRouter.canGoBack?.()) {
      ionRouter.goBack?.();
      return;
    }
    ionRouter.push(defaultHref, 'back', 'replace');
    syncConsumerRouteHistory(history, defaultHref);
    return;
  }

  if (toTab) {
    history.replace(defaultHref);
    return;
  }
  if (history.length > 1) {
    history.goBack();
    return;
  }
  history.replace(defaultHref);
}
