import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { formatScheduleTime } from '../lib/date-format.js';
import {
  buildMultiServiceConfirmPath,
  persistMultiServiceCart,
  uniqueMultiServiceIds,
} from '../lib/multi-service-booking.js';
import {
  buildProfessionalsFirstBookPath,
  buildProfessionalsPath,
  groupServicesByCategory,
} from '../lib/provider-booking.util.js';
import { fetchPublicServicesForSlot } from '../services/public-api.js';

export default function ProfessionalServicesPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const employeeId = params.get('employeeId')?.trim() ?? '';
  const startTime = params.get('startTime')?.trim() ?? '';
  const employeeName = params.get('employeeName')?.trim() ?? copy.professionalFallbackName;

  const multiEnabled = profile?.multiService?.enabled === true;
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!slug || employeeId && startTime) return;
    history.replace(buildProfessionalsPath(slug));
  }, [employeeId, history, slug, startTime]);

  const servicesQuery = useQuery({
    queryKey: ['public-services-for-slot', slug, employeeId, startTime, locale],
    queryFn: () => fetchPublicServicesForSlot(slug!, employeeId, startTime, locale),
    enabled: Boolean(slug && employeeId && startTime),
  });

  const services = servicesQuery.data ?? [];
  const groupedServices = useMemo(
    () => groupServicesByCategory(services, copy.uncategorizedServices),
    [copy.uncategorizedServices, services],
  );

  const toggleMultiService = (id: string) => {
    setServiceId(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const onContinue = useCallback(() => {
    if (!slug || !employeeId || !startTime) return;

    if (multiEnabled && selectedServiceIds.length >= 2) {
      const ids = uniqueMultiServiceIds(selectedServiceIds);
      persistMultiServiceCart(slug, ids);
      const schedulingMode = profile?.multiService?.schedulingMode ?? 'same_visit';
      if (schedulingMode === 'per_service') {
        history.push(buildMultiServiceConfirmPath(slug, ids));
        return;
      }
      const q = new URLSearchParams({
        services: ids.join(','),
        startTime,
        employeeId,
        employeeName,
      });
      history.push(`/s/${slug}/book/multi/checkout?${q.toString()}`);
      return;
    }

    const effectiveServiceId =
      serviceId ?? (multiEnabled && selectedServiceIds.length === 1 ? selectedServiceIds[0] : null);
    if (!effectiveServiceId) return;
    history.push(buildProfessionalsFirstBookPath(slug, effectiveServiceId, employeeId, startTime));
  }, [
    employeeId,
    employeeName,
    history,
    multiEnabled,
    profile?.multiService?.schedulingMode,
    selectedServiceIds,
    serviceId,
    slug,
    startTime,
  ]);

  const hasSingleSelection =
    Boolean(serviceId) || (multiEnabled && selectedServiceIds.length === 1);
  const hasMultiSelection = multiEnabled && selectedServiceIds.length >= 2;
  const continueDisabled = !hasSingleSelection && !hasMultiSelection;

  if (loading || servicesQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || 'Salon not found'}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref={buildProfessionalsPath(slug, { employeeId, startTime })}
            />
          </IonButtons>
          <IonTitle>{copy.selectService}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          {formatCopy(copy.multiServiceWithProvider, { name: employeeName })} ·{' '}
          {formatScheduleTime(startTime, locale)}
        </p>

        {services.length === 0 ? (
          <p style={{ color: '#6b7280' }}>{copy.noServicesForSlot}</p>
        ) : multiEnabled ? (
          groupedServices.map((group) => (
            <div key={group.key} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{group.categoryName}</h2>
              <IonList>
                {group.services.map((service) => {
                  const checked = selectedServiceIds.includes(service.id);
                  return (
                    <IonItem key={service.id} button onClick={() => toggleMultiService(service.id)}>
                      <IonCheckbox slot="start" checked={checked} />
                      <IonLabel>
                        <h2>{service.name}</h2>
                        <p>
                          {service.durationMinutes} min ·{' '}
                          {formatPublicMoney(service.price, service.currency, profile.currency)}
                        </p>
                      </IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            </div>
          ))
        ) : (
          <IonList>
            {services.map((service) => (
              <IonItem
                key={service.id}
                button
                color={serviceId === service.id ? 'primary' : undefined}
                onClick={() => setServiceId(service.id)}
              >
                <IonLabel>
                  <h2>{service.name}</h2>
                  <p>
                    {service.durationMinutes} min ·{' '}
                    {formatPublicMoney(service.price, service.currency, profile.currency)}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonButton
          expand="block"
          disabled={continueDisabled}
          style={{ marginTop: 16, '--background': primary }}
          onClick={onContinue}
        >
          {hasMultiSelection ? copy.multiServiceContinue : copy.continueBooking}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
