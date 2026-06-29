import { useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { isMobileManagerRole } from '../lib/provider-access';
import ProviderAiAssistant from './ProviderAiAssistant';
import { providerRouteFromPath } from '../lib/provider-ai-shell.util';

/** Global AI FAB + assistant on provider tab routes only. */
export function ProviderAiShell({
  children,
  overlaysVisible = true,
}: {
  children: ReactNode;
  overlaysVisible?: boolean;
}) {
  const business = useAuthStore((s) => s.business);
  const location = useLocation();
  const route = useMemo(() => providerRouteFromPath(location.pathname), [location.pathname]);
  const isManager = isMobileManagerRole(business?.membershipRole);

  return (
    <>
      {children}
      {business?.id ? (
        <ProviderAiAssistant
          businessId={business.id}
          screenContext={{ route: `/tabs/${route}` }}
          isManager={isManager}
          mobileRoute={route}
          overlaysVisible={overlaysVisible}
        />
      ) : null}
    </>
  );
}
