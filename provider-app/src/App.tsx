import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { lazy, Suspense, useEffect } from 'react';
import { Route, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuthStore } from './services/auth-store';
import { isFcmBuild, ensurePushRegistered } from './services/native-push';
import {
  PROVIDER_OPEN_BOOKING_EVENT,
  PROVIDER_PUSH_NAVIGATE_EVENT,
  dispatchProviderPushEffects,
  parseProviderPushPayload,
  providerTabPathFromPushUrl,
} from './lib/provider-push-deep-link.util';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import { OperationFeedbackHost } from './components/OperationFeedbackHost';
import { ProviderTabRoute } from './components/ProviderTabRoute';
import { ProviderAppRedirect, ProviderRootRedirect } from './components/ProviderAppRedirect';
import { AppStartupBridge } from './components/AppStartupBridge';
import { AppVersionGate } from './components/AppVersionGate';
import { BusinessDateFormatBootstrap } from './components/BusinessDateFormatBootstrap';
import { AccessibilityBootstrap } from './components/AccessibilityBootstrap';
import './components/operation-feedback.css';

const GuidePage = lazy(() => import('./pages/GuidePage'));

function AppRoutes() {
  const history = useHistory();
  const business = useAuthStore((s) => s.business);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path) history.push(path);
    };
    window.addEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(PROVIDER_PUSH_NAVIGATE_EVENT, onNavigate);
  }, [history]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (url: string) => {
      const path = providerTabPathFromPushUrl(url);
      dispatchProviderPushEffects(parseProviderPushPayload({ url: path }));
    };

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url);
    });

    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      if (event.url) handleUrl(event.url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  useEffect(() => {
    const onOpenBooking = () => {
      /* TodayPage listens for PROVIDER_OPEN_BOOKING_EVENT */
    };
    window.addEventListener(PROVIDER_OPEN_BOOKING_EVENT, onOpenBooking);
    return () => window.removeEventListener(PROVIDER_OPEN_BOOKING_EVENT, onOpenBooking);
  }, []);

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
    <Suspense fallback={null}>
      <IonRouterOutlet id="main" animated={false}>
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/accept-invite" component={AcceptInvitePage} />
        <Route exact path="/tabs/today">
          <ProviderTabRoute page="today" />
        </Route>
        <Route exact path="/tabs/lab-collection">
          <ProviderTabRoute page="lab-collection" />
        </Route>
        <Route exact path="/tabs/lab-results">
          <ProviderTabRoute page="lab-results" />
        </Route>
        <Route exact path="/tabs/clinic-tasks">
          <ProviderTabRoute page="clinic-tasks" />
        </Route>
        <Route exact path="/tabs/patients">
          <ProviderTabRoute page="patients" />
        </Route>
        <Route exact path="/tabs/patients/:customerId">
          <ProviderTabRoute page="patient-chart" />
        </Route>
        <Route exact path="/tabs/gift-cards">
          <ProviderTabRoute page="gift-cards" />
        </Route>
        <Route exact path="/tabs/calendar">
          <ProviderTabRoute page="calendar" />
        </Route>
        <Route exact path="/tabs/schedule">
          <ProviderTabRoute page="schedule" />
        </Route>
        <Route exact path="/tabs/profile/guide" component={GuidePage} />
        <Route exact path="/tabs/profile">
          <ProviderTabRoute page="profile" />
        </Route>
        <Route exact path="/tabs/notifications">
          <ProviderTabRoute page="notifications" />
        </Route>
        <Route exact path="/tabs">
          <ProviderAppRedirect to="/tabs/today" />
        </Route>
        <Route exact path="/">
          <ProviderRootRedirect />
        </Route>
      </IonRouterOutlet>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppVersionGate>
      <IonApp>
        <AccessibilityBootstrap />
        <BusinessDateFormatBootstrap />
        <AppStartupBridge />
        <OperationFeedbackHost />
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </IonApp>
    </AppVersionGate>
  );
}
