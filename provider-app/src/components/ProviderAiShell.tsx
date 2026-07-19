import { useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { useProviderActiveBookingStore } from '../services/provider-active-booking-store';
import { isMobileManagerRole } from '../lib/provider-access';
import ProviderAiAssistant from './ProviderAiAssistant';
import { providerRouteFromPath } from '../lib/provider-ai-shell.util';
import { providerTabPath, resolveProviderTabId } from '../lib/provider-tab-route.util';

/** Global AI FAB + assistant on provider tab routes and the standalone Guide page. */
export function ProviderAiShell({
  children,
  overlaysVisible = true,
}: {
  children: ReactNode;
  overlaysVisible?: boolean;
}) {
  const business = useAuthStore((s) => s.business);
  const location = useLocation();
  const activeBookingId = useProviderActiveBookingStore((s) => s.activeBookingId);
  const tabId = useMemo(() => resolveProviderTabId(location.pathname), [location.pathname]);
  const route = useMemo(() => providerRouteFromPath(location.pathname), [location.pathname]);
  const guideRoute = useMemo(() => providerTabPath(tabId), [tabId]);
  const isManager = isMobileManagerRole(business?.membershipRole);

  return (
    <>
      {children}
      {business?.id ? (
        <ProviderAiAssistant
          businessId={business.id}
          screenContext={{
            route: guideRoute,
            tab: tabId,
            mobileRoute: route,
            ...(activeBookingId ? { bookingId: activeBookingId } : {}),
          }}
          isManager={isManager}
          mobileRoute={route}
          overlaysVisible={overlaysVisible}
        />
      ) : null}
    </>
  );
}
