import type { PublicBusinessProfile } from '../lib/types.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import type { SalonTabId } from '../lib/salon-tab-route.util.js';
import SalonHomePage from '../pages/SalonHomePage.js';
import ServicesPage from '../pages/ServicesPage.js';
import AccountPage from '../pages/AccountPage.js';
import MyResultsPage from '../pages/MyResultsPage.js';
import LabToBookPage from '../pages/LabToBookPage.js';
import LabRequestsPage from '../pages/LabRequestsPage.js';

export function SalonTabPageContent({
  page,
  slug,
  profile,
  fromCache = false,
}: {
  page: SalonTabId;
  slug: string;
  profile: PublicBusinessProfile;
  fromCache?: boolean;
}) {
  const { copy } = useConsumerCopy(slug, profile);

  switch (page) {
    case 'home':
      return <SalonHomePage slug={slug} profile={profile} />;
    case 'services':
      return (
        <ServicesPage slug={slug} profile={profile} fromCache={fromCache} copy={copy} />
      );
    case 'results':
      return <MyResultsPage slug={slug} profile={profile} />;
    case 'lab-to-book':
      return <LabToBookPage slug={slug} profile={profile} />;
    case 'lab-requests':
      return <LabRequestsPage slug={slug} />;
    case 'account':
      return <AccountPage slug={slug} profile={profile} />;
    default:
      return <SalonHomePage slug={slug} profile={profile} />;
  }
}
