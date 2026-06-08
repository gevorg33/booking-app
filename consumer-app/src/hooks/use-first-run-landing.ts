import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  markFirstRunComplete,
  resolveFirstRunWelcomeRedirect,
} from '../lib/activation-onboarding.util.js';
import { configureAppAnalytics, track } from '../lib/app-analytics.js';
import {
  buildInstallAttributionProps,
  consumeDeferredInstallLink,
  peekDeferredInstallLink,
} from '../lib/deep-link.js';
import { buildWelcomeSalonSections } from '../lib/recent-salons.js';
import { peekResumableBookingDraft } from '../lib/activation-instrumentation.util.js';

/** Skip generic welcome when a deep link or single recent salon is known (adopt-3.3). */
export function useFirstRunLanding(): void {
  const history = useHistory();
  const location = useLocation();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (location.pathname !== '/' || attemptedRef.current) return;
    if (peekResumableBookingDraft()) return;
    attemptedRef.current = true;

    const deferredLink = peekDeferredInstallLink();
    const quickReturnSlugs = buildWelcomeSalonSections().quickReturn.map((salon) => salon.slug);
    const redirect = resolveFirstRunWelcomeRedirect({ deferredLink, quickReturnSlugs });
    if (!redirect) return;

    if (deferredLink) {
      consumeDeferredInstallLink();
      configureAppAnalytics({ appSurface: 'consumer_app', tenantSlug: deferredLink.slug });
      const props = buildInstallAttributionProps(deferredLink);
      if (props) track('viewed_salon', props);
    }

    markFirstRunComplete();
    track('onboarding_step_viewed', {
      onboardingStep: 'salon',
      firstRunRedirect: redirect.reason,
    });
    history.replace(redirect.path);
  }, [history, location.pathname]);
}
