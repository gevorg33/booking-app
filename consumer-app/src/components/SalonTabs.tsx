import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { calendarOutline, homeOutline, personOutline } from 'ionicons/icons';
import { Route } from 'react-router-dom';
import type { PublicBusinessProfile } from '../lib/types.js';
import SalonHomePage from '../pages/SalonHomePage.js';
import ServicesPage from '../pages/ServicesPage.js';
import AccountPage from '../pages/AccountPage.js';

export default function SalonTabs({
  slug,
  profile,
}: {
  slug: string;
  profile: PublicBusinessProfile;
}) {
  const base = `/s/${slug}`;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path={base} render={() => <SalonHomePage slug={slug} profile={profile} />} />
        <Route
          exact
          path={`${base}/services`}
          render={() => <ServicesPage slug={slug} profile={profile} />}
        />
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
        <IonTabButton tab="account" href={`${base}/account`}>
          <IonIcon icon={personOutline} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
