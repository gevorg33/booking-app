import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import {
  buildMultiServiceCheckoutPath,
  buildMultiServicePickerPath,
  buildMultiServiceSchedulePath,
  parseMultiServiceIds,
} from '../lib/multi-service-booking.js';
import { fetchPublicServices } from '../services/public-api.js';

/** Back-compat route: /s/:slug/book/multi → checkout, availability, or picker. */
export default function MultiServiceRedirectPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading } = useTenantBootstrap();

  useEffect(() => {
    if (loading || !slug) return;
    const params = new URLSearchParams(location.search);
    const startTime = params.get('startTime')?.trim();
    const servicesParam = params.get('services');
    const serviceIds = parseMultiServiceIds(servicesParam);

    void (async () => {
      const services = await fetchPublicServices(slug).catch(() => []);
      const validIds = serviceIds.filter((id) => services.some((svc) => svc.id === id));

      if (startTime && validIds.length >= 2) {
        const query: Record<string, string> = {
          services: validIds.join(','),
          startTime,
        };
        const employeeId = params.get('employeeId')?.trim();
        const employeeName = params.get('employeeName')?.trim();
        if (employeeId) query.employeeId = employeeId;
        if (employeeName) query.employeeName = employeeName;
        history.replace(buildMultiServiceCheckoutPath(slug, query));
        return;
      }

      if (validIds.length >= 2) {
        history.replace(
          buildMultiServiceSchedulePath(
            slug,
            validIds,
            profile?.multiService?.schedulingMode ?? 'same_visit',
          ),
        );
        return;
      }

      history.replace(buildMultiServicePickerPath(slug, validIds));
    })();
  }, [history, loading, location.search, profile?.multiService?.schedulingMode, slug]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
      </IonContent>
    </IonPage>
  );
}
