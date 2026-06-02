import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import { useDeepLinkRouter } from './hooks/use-deep-link-router.js';
import WelcomePage from './pages/WelcomePage.js';
import SalonTabShell from './components/SalonTabShell.js';
import BookPage from './pages/BookPage.js';
import LoginPage from './pages/LoginPage.js';
import ManageBookingPage from './pages/ManageBookingPage.js';

function AppRoutes() {
  useDeepLinkRouter();

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
