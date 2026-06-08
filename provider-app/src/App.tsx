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
import { calendarClearOutline, calendarOutline, checklistOutline, documentTextOutline, flaskOutline, giftOutline, peopleOutline, personOutline, todayOutline } from 'ionicons/icons';
import { useAuthStore } from './services/auth-store';
import { useI18n } from './i18n';
import { useProviderLabFeaturesEnabled } from './lib/use-provider-lab-features';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import TodayPage from './pages/TodayPage';
import SchedulePage from './pages/SchedulePage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import GiftCardQueuesPage from './pages/GiftCardQueuesPage';
import LabCollectionPage from './pages/LabCollectionPage';
import LabResultsPage from './pages/LabResultsPage';
import ClinicTasksPage from './pages/ClinicTasksPage';
import PatientLookupPage from './pages/PatientLookupPage';
import PatientChartSummaryPage from './pages/PatientChartSummaryPage';
import { isFcmBuild, ensurePushRegistered } from './services/native-push';
import { OperationFeedbackHost } from './components/OperationFeedbackHost';
import { ProviderAiShell } from './components/ProviderAiShell';
import { ProviderPushBridge } from './components/ProviderPushBridge';
import { BusinessDateFormatBootstrap } from './components/BusinessDateFormatBootstrap';
import './components/operation-feedback.css';

function AuthedTabs() {
  const { t } = useI18n();
  const business = useAuthStore((s) => s.business);
  const showLabCollection = useProviderLabFeaturesEnabled();

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
      <ProviderPushBridge />
      <ProviderAiShell>
        <IonRouterOutlet>
          <Route exact path="/tabs/today" component={TodayPage} />
          {showLabCollection && (
            <Route exact path="/tabs/lab-collection" component={LabCollectionPage} />
          )}
          {showLabCollection && (
            <Route exact path="/tabs/lab-results" component={LabResultsPage} />
          )}
          {showLabCollection && (
            <Route exact path="/tabs/clinic-tasks" component={ClinicTasksPage} />
          )}
          {showLabCollection && (
            <Route exact path="/tabs/patients" component={PatientLookupPage} />
          )}
          {showLabCollection && (
            <Route exact path="/tabs/patients/:customerId" component={PatientChartSummaryPage} />
          )}
          <Route exact path="/tabs/gift-cards" component={GiftCardQueuesPage} />
          <Route exact path="/tabs/calendar" component={CalendarPage} />
          <Route exact path="/tabs/schedule" component={SchedulePage} />
          <Route exact path="/tabs/profile" component={ProfilePage} />
          <Route exact path="/tabs">
            <Redirect to="/tabs/today" />
          </Route>
        </IonRouterOutlet>
      </ProviderAiShell>
      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/tabs/today">
          <IonIcon icon={todayOutline} />
          <IonLabel>{t('provider.navToday')}</IonLabel>
        </IonTabButton>
        {showLabCollection && (
          <IonTabButton tab="lab-collection" href="/tabs/lab-collection">
            <IonIcon icon={flaskOutline} />
            <IonLabel>{t('provider.navLabCollection')}</IonLabel>
          </IonTabButton>
        )}
        {showLabCollection && (
          <IonTabButton tab="lab-results" href="/tabs/lab-results">
            <IonIcon icon={documentTextOutline} />
            <IonLabel>{t('provider.navLabResults')}</IonLabel>
          </IonTabButton>
        )}
        {showLabCollection && (
          <IonTabButton tab="clinic-tasks" href="/tabs/clinic-tasks">
            <IonIcon icon={checklistOutline} />
            <IonLabel>{t('provider.navClinicTasks')}</IonLabel>
          </IonTabButton>
        )}
        {showLabCollection && (
          <IonTabButton tab="patients" href="/tabs/patients">
            <IonIcon icon={peopleOutline} />
            <IonLabel>{t('provider.navPatients')}</IonLabel>
          </IonTabButton>
        )}
        <IonTabButton tab="gift-cards" href="/tabs/gift-cards">
          <IonIcon icon={giftOutline} />
          <IonLabel>{t('provider.navGiftCards')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="calendar" href="/tabs/calendar">
          <IonIcon icon={calendarClearOutline} />
          <IonLabel>{t('provider.navCalendar')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="schedule" href="/tabs/schedule">
          <IonIcon icon={calendarOutline} />
          <IonLabel>{t('provider.navSchedule')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>{t('provider.navProfile')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <IonApp>
      <BusinessDateFormatBootstrap />
      <OperationFeedbackHost />
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
