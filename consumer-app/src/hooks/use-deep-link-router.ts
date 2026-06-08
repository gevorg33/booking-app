import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  buildInstallAttributionProps,
  consumeDeferredInstallLink,
  resolveDeferredNavigationPath,
  saveDeferredInstallLink,
} from '../lib/deep-link.js';
import { captureReferralFromDeferredLink } from '../lib/consumer-referral.util.js';
import { resolveDeepLinkLaunchTarget } from '../lib/deep-link-launch.util.js';
import { configureAppAnalytics, track } from '../lib/app-analytics.js';
import { shouldDeferNavigationForAbandonedBooking } from '../lib/booking-draft-resume.util.js';
import { peekResumableBookingDraft } from '../lib/activation-instrumentation.util.js';

function navigateDeferredInstall(
  history: ReturnType<typeof useHistory>,
  link: ReturnType<typeof consumeDeferredInstallLink>,
): void {
  if (!link) return;
  if (shouldDeferNavigationForAbandonedBooking(peekResumableBookingDraft())) return;
  configureAppAnalytics({ appSurface: 'consumer_app', tenantSlug: link.slug });
  const props = buildInstallAttributionProps(link);
  if (props) track('viewed_salon', props);
  history.replace(resolveDeferredNavigationPath(link));
}

export function useDeepLinkRouter() {
  const history = useHistory();

  useEffect(() => {
    const navigateFromUrl = (url: string) => {
      const target = resolveDeepLinkLaunchTarget(url);
      if (target?.deferredLink) {
        saveDeferredInstallLink(target.deferredLink);
        captureReferralFromDeferredLink(target.deferredLink);
      }
      if (target) {
        if (target.deferredLink) {
          configureAppAnalytics({
            appSurface: 'consumer_app',
            tenantSlug: target.deferredLink.slug,
          });
          const props = buildInstallAttributionProps(target.deferredLink);
          if (props) track('viewed_salon', props);
        }
        history.replace(target.path);
        return;
      }
      navigateDeferredInstall(history, consumeDeferredInstallLink());
    };

    if (!Capacitor.isNativePlatform()) return;

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) navigateFromUrl(result.url);
      else navigateDeferredInstall(history, consumeDeferredInstallLink());
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
export function stashSlugForInstall(
  slug: string,
  options?: {
    serviceId?: string;
    date?: string;
    slot?: string;
    employeeId?: string;
    installSource?: 'web_banner' | 'qr' | 'referral' | 'ad' | 'link';
  },
): void {
  saveDeferredInstallLink({ slug, ...options });
}
