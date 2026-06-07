import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect } from 'react';
import { Route, useHistory } from 'react-router-dom';
import { useDeepLinkRouter } from './hooks/use-deep-link-router.js';
import { CONSUMER_PUSH_NAVIGATE_EVENT } from './lib/consumer-native-push.util.js';
import WelcomePage from './pages/WelcomePage.js';
import SalonTabShell from './components/SalonTabShell.js';
import BookPage from './pages/BookPage.js';
import LoginPage from './pages/LoginPage.js';
import ManageBookingPage from './pages/ManageBookingPage.js';

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
    <IonRouterOutlet>
      <Route exact path="/" component={WelcomePage} />
      <Route exact path="/s/:slug/manage" component={ManageBookingPage} />
      <Route exact path="/s/:slug/book/:serviceId" component={BookPage} />
      <Route exact path="/s/:slug/login" component={LoginPage} />
      <Route path="/s/:slug" component={SalonTabShell} />
    </IonRouterOutlet>
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </IonApp>
  );
}
