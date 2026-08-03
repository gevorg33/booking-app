import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { ProviderBodyPortal } from './ProviderBodyPortal';
import { ProviderBottomTabBar } from './ProviderBottomTabBar';
import { ProviderAiShell } from './ProviderAiShell';
import { providerTabPath, resolveProviderTabId, type ProviderTabId } from '../lib/provider-tab-route.util';
import { useProviderLabFeaturesEnabled } from '../lib/use-provider-lab-features';
import { isMobileManagerRole } from '../lib/provider-access';

/** Tab bar + AI overlay when on /tabs/* (must not wrap IonPage — Android IonRouterOutlet). */
export function ProviderTabShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const business = useAuthStore((s) => s.business);
  const location = useLocation();
  const history = useHistory();
  const showLabCollection = useProviderLabFeaturesEnabled();
  const showGiftCards = isMobileManagerRole(business?.membershipRole);
  const onTabs = isAuthenticated && location.pathname.startsWith('/tabs');
  const activeTab = resolveProviderTabId(location.pathname);

  useEffect(() => {
    if (!onTabs) return;
    document.body.classList.add('provider-tab-active');
    return () => document.body.classList.remove('provider-tab-active');
  }, [onTabs]);

  if (!onTabs) return null;

  const openTab = (tab: ProviderTabId) => {
    const path = providerTabPath(tab);
    if (location.pathname === path) return;
    history.replace(path);
  };

  return (
    <>
      <ProviderAiShell>{null}</ProviderAiShell>
      <ProviderBodyPortal>
        <ProviderBottomTabBar
          activeTab={activeTab}
          showLabCollection={showLabCollection}
          showGiftCards={showGiftCards}
          onOpenTab={openTab}
        />
      </ProviderBodyPortal>
    </>
  );
}
