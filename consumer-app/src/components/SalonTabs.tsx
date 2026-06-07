import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonBadge,
} from '@ionic/react';
import { calendarOutline, flaskOutline, homeOutline, personOutline, beakerOutline } from 'ionicons/icons';
import { Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { PublicBusinessProfile } from '../lib/types.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { fetchMyClinicLabBookingRequests } from '../services/public-api.js';
import SalonHomePage from '../pages/SalonHomePage.js';
import ServicesPage from '../pages/ServicesPage.js';
import AccountPage from '../pages/AccountPage.js';
import MyResultsPage from '../pages/MyResultsPage.js';
import LabToBookPage from '../pages/LabToBookPage.js';
import LabRequestsPage from '../pages/LabRequestsPage.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';

export default function SalonTabs({
  slug,
  profile,
}: {
  slug: string;
  profile: PublicBusinessProfile;
}) {
  const base = `/s/${slug}`;
  const showResultsTab = shouldShowPatientResultsTab(profile.businessType);
  const authed = !!getCustomerToken(slug);
  const { copy } = useConsumerCopy(slug, profile);

  const pendingLabRequestsQuery = useQuery({
    queryKey: ['clinic-lab-booking-requests', slug],
    queryFn: () => fetchMyClinicLabBookingRequests(slug),
    enabled: showResultsTab && authed,
  });
  const pendingLabCount = pendingLabRequestsQuery.data?.length ?? 0;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path={base} render={() => <SalonHomePage slug={slug} profile={profile} />} />
        <Route
          exact
          path={`${base}/services`}
          render={() => <ServicesPage slug={slug} profile={profile} />}
        />
        {showResultsTab ? (
          <>
            <Route
              exact
              path={`${base}/results`}
              render={() => <MyResultsPage slug={slug} profile={profile} />}
            />
            <Route
              exact
              path={`${base}/lab-to-book`}
              render={() => <LabToBookPage slug={slug} profile={profile} />}
            />
            <Route
              exact
              path={`${base}/lab-requests`}
              render={() => <LabRequestsPage slug={slug} />}
            />
          </>
        ) : null}
        <Route
          exact
          path={`${base}/account`}
          render={() => <AccountPage slug={slug} profile={profile} />}
        />
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href={base}>
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="book" href={`${base}/services`}>
          <IonIcon icon={calendarOutline} />
          <IonLabel>Book</IonLabel>
        </IonTabButton>
        {showResultsTab ? (
          <IonTabButton tab="lab-to-book" href={`${base}/lab-to-book`}>
            <IonIcon icon={beakerOutline} />
            <IonLabel>{copy.myLabToBookTab}</IonLabel>
            {pendingLabCount > 0 ? (
              <IonBadge color="danger">{pendingLabCount}</IonBadge>
            ) : null}
          </IonTabButton>
        ) : null}
        {showResultsTab ? (
          <IonTabButton tab="results" href={`${base}/results`}>
            <IonIcon icon={flaskOutline} />
            <IonLabel>{copy.myResultsTab}</IonLabel>
          </IonTabButton>
        ) : null}
        <IonTabButton tab="account" href={`${base}/account`}>
          <IonIcon icon={personOutline} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
