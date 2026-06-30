import type { ProviderTabContentPage } from '../lib/provider-tab-route.util';
import TodayPage from '../pages/TodayPage';
import SchedulePage from '../pages/SchedulePage';
import CalendarPage from '../pages/CalendarPage';
import ProfilePage from '../pages/ProfilePage';
import PushNotificationsPage from '../pages/PushNotificationsPage';
import GiftCardQueuesPage from '../pages/GiftCardQueuesPage';
import LabCollectionPage from '../pages/LabCollectionPage';
import LabResultsPage from '../pages/LabResultsPage';
import ClinicTasksPage from '../pages/ClinicTasksPage';
import PatientLookupPage from '../pages/PatientLookupPage';
import PatientChartSummaryPage from '../pages/PatientChartSummaryPage';

export function ProviderTabPageContent({
  page,
  embedded = true,
}: {
  page: ProviderTabContentPage;
  embedded?: boolean;
}) {
  switch (page) {
    case 'today':
      return <TodayPage embedded={embedded} />;
    case 'gift-cards':
      return <GiftCardQueuesPage embedded={embedded} />;
    case 'calendar':
      return <CalendarPage embedded={embedded} />;
    case 'schedule':
      return <SchedulePage embedded={embedded} />;
    case 'profile':
      return <ProfilePage embedded={embedded} />;
    case 'notifications':
      return <PushNotificationsPage embedded={embedded} />;
    case 'lab-collection':
      return <LabCollectionPage embedded={embedded} />;
    case 'lab-results':
      return <LabResultsPage embedded={embedded} />;
    case 'clinic-tasks':
      return <ClinicTasksPage embedded={embedded} />;
    case 'patients':
      return <PatientLookupPage embedded={embedded} />;
    case 'patient-chart':
      return <PatientChartSummaryPage embedded={embedded} />;
    default:
      return <TodayPage embedded={embedded} />;
  }
}
