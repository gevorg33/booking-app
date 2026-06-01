import { Redirect, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { calendarOutline, giftOutline, personOutline, todayOutline } from 'ionicons/icons';
import { useAuthStore } from './services/auth-store';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import TodayPage from './pages/TodayPage';
import SchedulePage from './pages/SchedulePage';
import ProfilePage from './pages/ProfilePage';
import GiftCardQueuesPage from './pages/GiftCardQueuesPage';
import { isFcmBuild, ensurePushRegistered } from './services/native-push';

function AuthedTabs() {
  const business = useAuthStore((s) => s.business);

  useEffect(() => {
    if (!business?.id || !Capacitor.isNativePlatform() || !isFcmBuild()) return;

    void ensurePushRegistered(business.id);

    let removeHandle: (() => void) | undefined;
    void CapacitorApp.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
      if (isActive) void ensurePushRegistered(business.id);
    }).then((handle) => {
      removeHandle = () => void handle.remove();
    });

    return () => {
      removeHandle?.();
    };
  }, [business?.id]);

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/today" component={TodayPage} />
        <Route exact path="/tabs/gift-cards" component={GiftCardQueuesPage} />
        <Route exact path="/tabs/schedule" component={SchedulePage} />
        <Route exact path="/tabs/profile" component={ProfilePage} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/today" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/tabs/today">
          <IonIcon icon={todayOutline} />
          <IonLabel>Today</IonLabel>
        </IonTabButton>
        <IonTabButton tab="gift-cards" href="/tabs/gift-cards">
          <IonIcon icon={giftOutline} />
          <IonLabel>Gift cards</IonLabel>
        </IonTabButton>
        <IonTabButton tab="schedule" href="/tabs/schedule">
          <IonIcon icon={calendarOutline} />
          <IonLabel>Schedule</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/accept-invite" component={AcceptInvitePage} />
          <Route path="/tabs" render={() => (isAuthenticated ? <AuthedTabs /> : <Redirect to="/login" />)} />
          <Route exact path="/">
            <Redirect to={isAuthenticated ? '/tabs/today' : '/login'} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
