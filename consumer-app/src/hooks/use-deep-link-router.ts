import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  buildManageBookingPath,
  buildResultsPath,
  buildSalonPath,
  consumeDeferredSlug,
  parseLabBookingRequestRoute,
  parseManageBookingRoute,
  parseResultReadyRoute,
  parseTenantSlugFromUrl,
  resolveLabBookingRequestNavigationPath,
  saveDeferredSlug,
} from '../lib/deep-link.js';

export function useDeepLinkRouter() {
  const history = useHistory();

  useEffect(() => {
    const navigateFromUrl = (url: string) => {
      const manage = parseManageBookingRoute(url);
      if (manage) {
        history.replace(
          buildManageBookingPath(manage.slug, manage.bookingId, manage.token),
        );
        return;
      }
      const labBookingRequest = parseLabBookingRequestRoute(url);
      if (labBookingRequest) {
        history.replace(resolveLabBookingRequestNavigationPath(labBookingRequest));
        return;
      }
      const resultReady = parseResultReadyRoute(url);
      if (resultReady) {
        history.replace(buildResultsPath(resultReady.slug));
        return;
      }
      const slug = parseTenantSlugFromUrl(url);
      if (slug) {
        history.replace(buildSalonPath(slug));
        return;
      }
      const deferred = consumeDeferredSlug();
      if (deferred) {
        history.replace(buildSalonPath(deferred));
      }
    };

    if (!Capacitor.isNativePlatform()) return;

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) navigateFromUrl(result.url);
      else {
        const deferred = consumeDeferredSlug();
        if (deferred) history.replace(buildSalonPath(deferred));
      }
    });

    const pending = CapacitorApp.addListener('appUrlOpen', (event) => {
      if (event.url) navigateFromUrl(event.url);
    });

    return () => {
      void pending.then((h) => h.remove());
    };
  }, [history]);
}

/** Call from web landing before App Store redirect to preserve tenant after install. */
export function stashSlugForInstall(slug: string): void {
  saveDeferredSlug(slug);
}
