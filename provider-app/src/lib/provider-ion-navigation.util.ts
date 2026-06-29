import { Capacitor } from '@capacitor/core';
import type { History } from 'history';

/** Minimal ion router surface — matches `useIonRouter()`. */
export type ProviderIonRouter = {
  push: (
    pathname: string,
    routerDirection?: 'forward' | 'back' | 'root',
    routeAction?: 'push' | 'replace' | 'pop',
  ) => void;
  goBack?: () => void;
  canGoBack?: () => boolean;
};

const PROVIDER_TAB_PATH =
  /^\/tabs\/(today|gift-cards|calendar|schedule|profile|notifications|lab-collection|lab-results|clinic-tasks|patients(?:\/[^/]+)?)$/;

export function isProviderTabPath(path: string): boolean {
  return PROVIDER_TAB_PATH.test(path.split('?')[0] ?? path);
}

/** Sync React Router after Ionic navigation so useLocation() stays aligned. */
export function syncProviderRouteHistory(
  history: History,
  path: string,
  state?: unknown,
): void {
  history.replace(path, state);
}

/** Replace current route — keeps Ionic stack aligned on Android. */
export function replaceProviderRoute(
  history: History,
  ionRouter: ProviderIonRouter | undefined,
  path: string,
  state?: unknown,
): void {
  if (Capacitor.isNativePlatform() && ionRouter) {
    ionRouter.push(path, 'root', 'replace');
    syncProviderRouteHistory(history, path, state);
    return;
  }
  history.replace(path, state);
}

/** Push a route and keep Ionic's native stack in sync on Android. */
export function pushProviderRoute(
  history: History,
  ionRouter: ProviderIonRouter | undefined,
  path: string,
  state?: unknown,
): void {
  if (Capacitor.isNativePlatform() && ionRouter) {
    ionRouter.push(path, 'forward', 'push');
    return;
  }
  history.push(path, state);
}
