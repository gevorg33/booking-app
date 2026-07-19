import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonLabel,
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
import { ConsumerGroupedTimeSlotList } from '../components/ConsumerGroupedTimeSlotList.js';
import { ConsumerSlotSpecialistPicker } from '../components/ConsumerSlotSpecialistPicker.js';
import { ConsumerProviderAvatar } from '../components/ConsumerProviderAvatar.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import { formatScheduleTime } from '../lib/date-format.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicSlot, PublicServiceSlotProvider } from '../lib/types.js';
import {
  buildMultiServiceCheckoutPath,
  buildMultiServicePickerPath,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
} from '../lib/multi-service-booking.js';
import {
  fetchPublicServices,
  fetchServiceDaySlots,
  fetchServiceSlotProviders,
  suggestPublicMultiServiceLines,
} from '../services/public-api.js';

interface LineState {
  key: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
  startTime: string;
  dateKey: string;
}

function MultiServiceConfirmLineCard({
  slug,
  line,
  index,
  minDate,
  primary,
  copy,
  locale,
  onUpdate,
}: {
  slug: string;
  line: LineState;
  index: number;
  minDate: string;
  primary: string;
  copy: ConsumerCopy;
  locale: string;
  onUpdate: (key: string, patch: Partial<LineState>) => void;
}) {
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [providers, setProviders] = useState<PublicServiceSlotProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  useEffect(() => {
    if (!line.dateKey) return;
    let cancelled = false;
    setSlotsLoading(true);
    void (async () => {
      try {
        const { slots: result } = await fetchServiceDaySlots(slug, line.serviceId, line.dateKey);
        if (cancelled) return;
        setSlots(result);
        const match =
          result.find((slot) => slot.startTime === line.startTime) ?? result[0];
        onUpdate(line.key, {
          startTime: match?.startTime ?? '',
          employeeId: match?.employeeId ?? '',
          employeeName: match?.employeeName ?? '',
        });
      } catch {
        if (!cancelled) {
          setSlots([]);
          onUpdate(line.key, { startTime: '', employeeId: '', employeeName: '' });
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.dateKey, line.key, line.serviceId, slug]);

  useEffect(() => {
    if (!line.startTime) {
      setProviders([]);
      return;
    }
    let cancelled = false;
    setProvidersLoading(true);
    fetchServiceSlotProviders(slug, line.serviceId, line.startTime)
      .then((result) => {
        if (!cancelled) setProviders(result);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [line.serviceId, line.startTime, slug]);

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
      }}
    >
      <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>
        Service {index + 1}
      </p>
      <h3 style={{ margin: '4px 0' }}>{line.serviceName}</h3>
      <p style={{ color: '#6b7280', fontSize: 14 }}>{line.durationMinutes} min</p>

      <IonItem lines="none">
        <IonLabel position="stacked">Date</IonLabel>
        <IonDatetime
          className="consumer-booking-datetime"
          presentation="date"
          min={minDate}
          value={line.dateKey}
          onIonChange={(e) => {
            const value = e.detail.value;
            if (typeof value !== 'string') return;
            onUpdate(line.key, { dateKey: value.slice(0, 10), startTime: '', employeeId: '', employeeName: '' });
          }}
        />
      </IonItem>

      {slotsLoading ? (
        <IonSpinner className="ion-margin-top" />
      ) : (
        <ConsumerGroupedTimeSlotList
          slots={slots}
          selectedStartTime={line.startTime || null}
          onSelect={(startTime) => {
            const match = slots.find((slot) => slot.startTime === startTime);
            onUpdate(line.key, {
              startTime,
              employeeId: match?.employeeId ?? '',
              employeeName: match?.employeeName ?? '',
            });
          }}
          copy={copy}
          primaryColor={primary}
          formatSlotLabel={(startTime) => formatScheduleTime(startTime, locale)}
        />
      )}

      {!providersLoading && providers.length > 1 ? (
        <ConsumerSlotSpecialistPicker
          copy={copy}
          primaryColor={primary}
          providers={providers}
          value={line.employeeId}
          onChange={(employeeId) => {
            const provider = providers.find((entry) => entry.id === employeeId);
            onUpdate(line.key, { employeeId, employeeName: provider?.name ?? '' });
          }}
        />
      ) : null}

      {!providersLoading && providers.length === 1 ? (
        <IonItem lines="none">
          <div slot="start">
            <ConsumerProviderAvatar
              name={providers[0]!.name}
              avatarUrl={providers[0]!.avatarUrl}
              primaryColor={primary}
              size={36}
            />
          </div>
          <IonLabel>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>{copy.selectSpecialist}</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{providers[0]!.name}</p>
            {providers[0]!.role ? (
              <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{providers[0]!.role}</p>
            ) : null}
          </IonLabel>
        </IonItem>
      ) : null}
    </div>
  );
}

export default function MultiServiceConfirmPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });

  const servicesQuery = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => fetchPublicServices(slug!),
    enabled: Boolean(slug),
  });
  const services = servicesQuery.data ?? [];

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const serviceIds = useMemo(
    () => resolveMultiServiceCartFromLocation(slug ?? '', searchParams.get('services'), services),
    [searchParams, services, slug],
  );

  const [lines, setLines] = useState<LineState[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!slug || services.length === 0) return;
    const resolved = resolveMultiServiceCartFromLocation(
      slug,
      searchParams.get('services'),
      services,
    );
    if (resolved.length < 2) {
      history.replace(buildMultiServicePickerPath(slug, resolved));
      return;
    }
    persistMultiServiceCart(slug, resolved);
    if (!searchParams.get('services')) {
      const q = new URLSearchParams({ services: resolved.join(',') });
      history.replace(`${location.pathname}?${q.toString()}`);
    }
  }, [history, location.pathname, searchParams, services, slug]);

  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => services.find((svc) => svc.id === id))
        .filter(Boolean) ?? [],
    [serviceIds, services],
  );

  useEffect(() => {
    if (!slug || selectedServices.length < 2) return;
    setLines(
      selectedServices.map((svc) => ({
        key: svc!.id,
        serviceId: svc!.id,
        serviceName: svc!.name,
        durationMinutes: svc!.durationMinutes + (svc!.bufferMinutes ?? 0),
        employeeId: '',
        employeeName: '',
        startTime: '',
        dateKey: '',
      })),
    );
    setLoadingDefaults(true);
    setMessage('');

    let cancelled = false;
    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceLines(slug, serviceIds);
        if (cancelled) return;
        setLines((prev) =>
          prev.map((line, index) => {
            const slot = suggested.lines[index];
            if (!slot) return line;
            return {
              ...line,
              employeeId: slot.employeeId,
              employeeName: slot.employeeName,
              startTime: slot.startTime,
              dateKey: slot.startTime.slice(0, 10),
            };
          }),
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setMessage(
            formatFriendlyNetworkError(err, copy.assistantErrorGeneric),
          );
        }
      } finally {
        if (!cancelled) setLoadingDefaults(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.assistantErrorGeneric, selectedServices.length, serviceIds, slug]);

  const updateLine = useCallback((key: string, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }, []);

  const allScheduled = useMemo(
    () => lines.every((line) => line.startTime && line.employeeId),
    [lines],
  );

  const onContinue = () => {
    if (!slug) return;
    history.push(
      buildMultiServiceCheckoutPath(slug, {
        services: serviceIds.join(','),
        lines: JSON.stringify(
          lines.map((line) => ({
            serviceId: line.serviceId,
            employeeId: line.employeeId,
            employeeName: line.employeeName,
            startTime: line.startTime,
          })),
        ),
      }),
    );
  };

  if (loading || servicesQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || serviceIds.length < 2) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || 'Select at least two services to continue.'}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';
  const totalPrice = selectedServices.reduce((sum, svc) => sum + Number(svc!.price), 0);
  const currency = resolveTenantPriceCurrency(selectedServices[0]?.currency, profile.currency);
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildMultiServicePickerPath(slug, serviceIds)}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.multiServiceConfirmTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 8 }}>{copy.multiServiceScheduleEach}</p>
        <p style={{ fontWeight: 600, marginBottom: 16 }}>
          {formatPublicMoney(totalPrice, currency, profile.currency)}
        </p>

        {loadingDefaults ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonSpinner name="crescent" />
            <span>{copy.multiServiceFindingSlots}</span>
          </div>
        ) : null}

        {message ? <p style={{ color: '#b91c1c' }}>{message}</p> : null}

        {lines.map((line, index) => (
          <MultiServiceConfirmLineCard
            key={line.key}
            slug={slug}
            line={line}
            index={index}
            minDate={minDate}
            primary={primary}
            copy={copy}
            locale={locale}
            onUpdate={updateLine}
          />
        ))}

        <IonButton
          expand="block"
          disabled={!allScheduled || loadingDefaults}
          style={{ '--background': primary }}
          onClick={onContinue}
        >
          {copy.assistantContinueBooking}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
