import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { isMobileManagerRole } from '../lib/provider-access';
import ProviderAiAssistant from './ProviderAiAssistant';
import { ProviderAiFab } from './ProviderAiFab';
import { providerRouteFromPath } from '../lib/provider-ai-shell.util';

/** Global AI FAB + assistant on all provider tabs (ai-m3). */
export function ProviderAiShell({ children }: { children: React.ReactNode }) {
  const business = useAuthStore((s) => s.business);
  const location = useLocation();
  const route = useMemo(() => providerRouteFromPath(location.pathname), [location.pathname]);
  const isManager = isMobileManagerRole(business?.membershipRole);

  return (
    <>
      {children}
      {business?.id ? (
        <>
          <ProviderAiFab />
          <ProviderAiAssistant
            businessId={business.id}
            screenContext={{ route: `/tabs/${route}` }}
            isManager={isManager}
            mobileRoute={route}
          />
        </>
      ) : null}
    </>
  );
}
