import { useHistory, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProviderBodyPortal } from './ProviderBodyPortal';
import { ProviderBottomTabBar } from './ProviderBottomTabBar';
import { ProviderAiShell } from './ProviderAiShell';
import { providerTabPath, type ProviderTabId } from '../lib/provider-tab-route.util';
import { useProviderClinicNav } from '../lib/use-provider-clinic-nav';
import { useProviderTabOverlaysVisible } from '../hooks/use-provider-tab-overlays-visible';
import { useAuthStore } from '../services/auth-store';
import { isMobileManagerRole } from '../lib/provider-access';

/** Bottom tab bar + chrome for provider tab routes (no nested IonRouterOutlet). */
export function ProviderTabChrome({
  activeTab,
  children,
}: {
  activeTab: ProviderTabId;
  children: ReactNode;
}) {
  const history = useHistory();
  const location = useLocation();
  const clinicNav = useProviderClinicNav();
  const { overlaysVisible } = useProviderTabOverlaysVisible();
  const { business } = useAuthStore();
  const showGiftCards = isMobileManagerRole(business?.membershipRole);

  const openTab = (tab: ProviderTabId) => {
    const path = providerTabPath(tab);
    if (location.pathname === path) return;
    history.replace(path);
  };

  return (
    <>
      <ProviderAiShell overlaysVisible={overlaysVisible}>{children}</ProviderAiShell>
      {overlaysVisible ? (
        <ProviderBodyPortal>
          <ProviderBottomTabBar
            activeTab={activeTab}
            showLabCollection={clinicNav.showLabCollection}
            showGiftCards={showGiftCards}
            onOpenTab={openTab}
          />
        </ProviderBodyPortal>
      ) : null}
    </>
  );
}
