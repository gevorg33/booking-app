import { lazy, Suspense } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import { useDeepLinkRouter } from './hooks/use-deep-link-router.js';
import { useFirstRunLanding } from './hooks/use-first-run-landing.js';
import { useBookingDraftResume } from './hooks/use-booking-draft-resume.js';
import { AccessibilityBootstrap } from './components/AccessibilityBootstrap.js';
import { AppAnalyticsBootstrap } from './components/AppAnalyticsBootstrap.js';
import { AppStartupBridge } from './components/AppStartupBridge.js';
import { AppVersionGate } from './components/AppVersionGate.js';
import { ConsumerPushBridge } from './components/ConsumerPushBridge.js';
import { ConsumerProvisionalUpgradeBridge } from './components/ConsumerProvisionalUpgradeBridge.js';
import { ConsumerPushDeniedReaskBridge } from './components/ConsumerPushDeniedReaskBridge.js';
import { ConsumerPushForegroundHost } from './components/ConsumerPushForegroundHost.js';
import { OperationFeedbackHost } from './components/OperationFeedbackHost.js';

const WelcomePage = lazy(() => import('./pages/WelcomePage.js'));
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const SalonTabShell = lazy(() => import('./components/SalonTabShell.js'));
const BookPage = lazy(() => import('./pages/BookPage.js'));
const ManageBookingPage = lazy(() => import('./pages/ManageBookingPage.js'));

function RouteFallback() {
  return (
    <div className="ion-padding ion-text-center">
      <IonSpinner name="crescent" />
    </div>
  );
}

function AppRoutes() {
  useDeepLinkRouter();
  useBookingDraftResume();
  useFirstRunLanding();

  return (
    <Suspense fallback={<RouteFallback />}>
      <IonRouterOutlet>
        <Route exact path="/" component={WelcomePage} />
        <Route exact path="/s/:slug/manage" component={ManageBookingPage} />
        <Route exact path="/s/:slug/book/:serviceId" component={BookPage} />
        <Route exact path="/s/:slug/login" component={LoginPage} />
        <Route path="/s/:slug" component={SalonTabShell} />
      </IonRouterOutlet>
    </Suspense>
  );
}

export default function App() {
  return (
    <IonApp>
      <AppVersionGate>
        <AccessibilityBootstrap />
        <AppAnalyticsBootstrap />
        <AppStartupBridge />
        <OperationFeedbackHost />
        <ConsumerPushForegroundHost />
        <IonReactRouter>
          <ConsumerPushBridge />
          <ConsumerProvisionalUpgradeBridge />
          <ConsumerPushDeniedReaskBridge />
          <AppRoutes />
        </IonReactRouter>
      </AppVersionGate>
    </IonApp>
  );
}
