import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { lazy, Suspense, useEffect } from 'react';
import { Route, useHistory } from 'react-router-dom';
import { useDeepLinkRouter } from './hooks/use-deep-link-router.js';
import { CONSUMER_PUSH_NAVIGATE_EVENT } from './lib/consumer-native-push.util.js';
import { AccessibilityBootstrap } from './components/AccessibilityBootstrap.js';
import { AppStartupBridge } from './components/AppStartupBridge.js';
import { AppVersionGate } from './components/AppVersionGate.js';
import { OperationFeedbackHost } from './components/OperationFeedbackHost.js';
import WelcomePage from './pages/WelcomePage.js';
import { SalonTabRoute } from './components/SalonTabRoute.js';
import SalonRedirectToHome from './components/SalonRedirectToHome.js';
import MultiServicePickerPage from './pages/MultiServicePickerPage.js';
import AnyAvailabilityPage from './pages/AnyAvailabilityPage.js';
import MultiServiceAvailabilityPage from './pages/MultiServiceAvailabilityPage.js';
import MultiServiceConfirmPage from './pages/MultiServiceConfirmPage.js';
import MultiServiceCheckoutPage from './pages/MultiServiceCheckoutPage.js';
import MultiServiceRedirectPage from './pages/MultiServiceRedirectPage.js';
import { resolveBookPathCollision } from './lib/multi-service-booking.js';
import LoginPage from './pages/LoginPage.js';
import ManageBookingPage from './pages/ManageBookingPage.js';
import GiftCardCatalogPage from './pages/GiftCardCatalogPage.js';
import GiftCardCheckoutPage from './pages/GiftCardCheckoutPage.js';
import PackageConfirmPage from './pages/PackageConfirmPage.js';
import PackageCheckoutPage from './pages/PackageCheckoutPage.js';
import ProfessionalsPage from './pages/ProfessionalsPage.js';
import ProfessionalServicesPage from './pages/ProfessionalServicesPage.js';
import ProviderProfilePage from './pages/ProviderProfilePage.js';
import SalonProfilePage from './pages/SalonProfilePage.js';

const BookPage = lazy(() => import('./pages/BookPage.js'));
const GuidePage = lazy(() => import('./pages/GuidePage.js'));

function AppRoutes() {
  const history = useHistory();
  useDeepLinkRouter();

  useEffect(() => {
    const onPushNavigate = (event: Event) => {
      const path = (event as CustomEvent<{ path: string }>).detail?.path;
      if (path) history.push(path);
    };
    window.addEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onPushNavigate);
    return () => window.removeEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onPushNavigate);
  }, [history]);

  return (
    <Suspense fallback={null}>
      <IonRouterOutlet id="main" animated={false}>
        <Route exact path="/" component={WelcomePage} />
        <Route exact path="/s/:slug/manage" component={ManageBookingPage} />
        <Route exact path="/s/:slug/book/any/availability" component={AnyAvailabilityPage} />
        <Route exact path="/s/:slug/book/any" component={MultiServicePickerPage} />
        <Route exact path="/s/:slug/book/packages/:packageId/checkout" component={PackageCheckoutPage} />
        <Route exact path="/s/:slug/book/packages/:packageId" component={PackageConfirmPage} />
        <Route exact path="/s/:slug/professionals/services" component={ProfessionalServicesPage} />
        <Route exact path="/s/:slug/professionals" component={ProfessionalsPage} />
        <Route exact path="/s/:slug/providers/:employeeId" component={ProviderProfilePage} />
        <Route exact path="/s/:slug/book/multi/checkout" component={MultiServiceCheckoutPage} />
        <Route exact path="/s/:slug/book/multi/availability" component={MultiServiceAvailabilityPage} />
        <Route exact path="/s/:slug/book/multi/confirm" component={MultiServiceConfirmPage} />
        <Route exact path="/s/:slug/book/multi" component={MultiServiceRedirectPage} />
        {/*
          e2e-bug.7 / e2e-bug.32 — IonRouterOutlet can match :serviceId over /book/any and /book/multi
          (no Switch). Guard reserved segments so BookPage never mounts for those literals.
        */}
        <Route
          exact
          path="/s/:slug/book/:serviceId"
          render={({ match }) => {
            const target = resolveBookPathCollision(match.params.serviceId);
            if (target === 'picker') return <MultiServicePickerPage />;
            if (target === 'multi_redirect') return <MultiServiceRedirectPage />;
            return <BookPage />;
          }}
        />
        <Route exact path="/s/:slug/gift-cards/checkout" component={GiftCardCheckoutPage} />
        <Route exact path="/s/:slug/gift-cards" component={GiftCardCatalogPage} />
        <Route exact path="/s/:slug/login" component={LoginPage} />
        <Route exact path="/s/:slug/guide" component={GuidePage} />
        <Route exact path="/s/:slug/profile" component={SalonProfilePage} />
        <Route exact path="/s/:slug/home">
          <SalonTabRoute page="home" />
        </Route>
        <Route exact path="/s/:slug/services">
          <SalonTabRoute page="services" />
        </Route>
        <Route exact path="/s/:slug/account">
          <SalonTabRoute page="account" />
        </Route>
        <Route exact path="/s/:slug/results">
          <SalonTabRoute page="results" />
        </Route>
        <Route exact path="/s/:slug/lab-to-book">
          <SalonTabRoute page="lab-to-book" />
        </Route>
        <Route exact path="/s/:slug/lab-requests">
          <SalonTabRoute page="lab-requests" />
        </Route>
        <Route exact path="/s/:slug">
          <SalonRedirectToHome />
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
        <AppStartupBridge />
        <OperationFeedbackHost />
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </IonApp>
    </AppVersionGate>
  );
}
