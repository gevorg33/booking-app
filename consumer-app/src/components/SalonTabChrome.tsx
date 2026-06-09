import { useQuery } from '@tanstack/react-query';
import { useSalonTabOverlaysVisible } from '../hooks/use-salon-tab-overlays-visible.js';
import { useHistory, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { PublicBusinessProfile } from '../lib/types.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { fetchMyClinicLabBookingRequests, fetchMyBookings } from '../services/public-api.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useConsumerLocale } from '../hooks/use-consumer-locale.js';
import { useHomeScreenWidgetSync } from '../hooks/use-home-screen-widget-sync.js';
import { buildSalonTabHomePath, type SalonTabId } from '../lib/salon-tab-route.util.js';
import { ConsumerAiShell } from './ConsumerAiShell.js';
import { ConsumerBodyPortal } from './ConsumerBodyPortal.js';
import { ConsumerOfflineBanner } from './ConsumerOfflineBanner.js';
import { SalonBottomTabBar } from './SalonBottomTabBar.js';

/** Bottom tab bar + chrome for salon tab routes (no nested IonRouterOutlet). */
export function SalonTabChrome({
  slug,
  profile,
  fromCache = false,
  children,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  fromCache?: boolean;
  children: ReactNode;
}) {
  const history = useHistory();
  const location = useLocation();
  const base = `/s/${slug}`;
  const homePath = buildSalonTabHomePath(slug);
  const activeTab = location.pathname.startsWith(base)
    ? (location.pathname.slice(base.length) || '/home').replace(/^\//, '')
    : '';
  const showResultsTab = shouldShowPatientResultsTab(profile.businessType);
  const authed = !!getCustomerToken(slug);
  const { copy } = useConsumerCopy(slug, profile);
  const { locale } = useConsumerLocale(slug, profile);

  const pendingLabRequestsQuery = useQuery({
    queryKey: ['clinic-lab-booking-requests', slug],
    queryFn: () => fetchMyClinicLabBookingRequests(slug),
    enabled: showResultsTab && authed,
  });
  const pendingLabCount = pendingLabRequestsQuery.data?.length ?? 0;

  const bookingsQuery = useQuery({
    queryKey: ['bookings', slug],
    queryFn: () => fetchMyBookings(slug),
    enabled: authed,
  });

  useHomeScreenWidgetSync({
    slug,
    profile,
    authed,
    bookings: bookingsQuery.data,
    copy,
    locale,
  });

  const { overlaysVisible } = useSalonTabOverlaysVisible();

  const openTab = (tab: SalonTabId) => {
    const replaceTab = (path: string) => {
      if (location.pathname === path) return;
      history.replace(path);
    };
    switch (tab) {
      case 'home':
        replaceTab(homePath);
        break;
      case 'services':
        replaceTab(`${base}/services`);
        break;
      case 'account':
        replaceTab(`${base}/account`);
        break;
      case 'results':
        replaceTab(`${base}/results`);
        break;
      case 'lab-to-book':
        replaceTab(`${base}/lab-to-book`);
        break;
      case 'lab-requests':
        replaceTab(`${base}/lab-requests`);
        break;
      default:
        replaceTab(homePath);
    }
  };

  return (
    <>
      <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
      <ConsumerAiShell
        slug={slug}
        profile={profile}
        copy={copy}
        locale={locale}
        overlaysVisible={overlaysVisible}
      >
        {children}
      </ConsumerAiShell>
      {overlaysVisible ? (
        <ConsumerBodyPortal>
          <SalonBottomTabBar
            activeTab={activeTab}
            showResultsTab={showResultsTab}
            pendingLabCount={pendingLabCount}
            copy={copy}
            onOpenTab={openTab}
          />
        </ConsumerBodyPortal>
      ) : null}
    </>
  );
}
