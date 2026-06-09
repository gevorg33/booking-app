import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  buildMultiServiceCheckoutPath,
  buildMultiServicePickerPath,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  toDateKey,
  uniqueMultiServiceIds,
} from '../lib/multi-service-booking.js';
import {
  fetchPublicServices,
  getPublicMultiServiceBlockSlots,
  getPublicMultiServiceProviders,
  suggestPublicMultiServiceBlock,
} from '../services/public-api.js';

export default function MultiServiceAvailabilityPage() {
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

  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<
    Array<{ startTime: string; employeeId: string; employeeName: string }>
  >([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [slotProviders, setSlotProviders] = useState<
    Array<{ id: string; name: string; earliestStartTime?: string }>
  >([]);
  const [laterProviders, setLaterProviders] = useState<
    Array<{ id: string; name: string; earliestStartTime?: string }>
  >([]);
  const [providerPickerOpen, setProviderPickerOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const suggestRequestRef = useRef(0);
  const slotsRequestRef = useRef(0);
  const selectedStartRef = useRef<string | null>(null);
  const dateKeyRef = useRef('');
  const userPickedDateRef = useRef(false);

  useEffect(() => {
    if (!slug || services.length === 0) return;
    const resolved = resolveMultiServiceCartFromLocation(
      slug,
      searchParams.get('services'),
      services,
    );
    if (resolved.length < 2) {
      history.replace(
        resolved.length === 0
          ? buildMultiServicePickerPath(slug, [])
          : buildMultiServicePickerPath(slug, resolved),
      );
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

  const serviceSelectionKey = useMemo(
    () => uniqueMultiServiceIds(serviceIds).slice().sort().join(','),
    [serviceIds],
  );

  const loadDaySlots = useCallback(
    async (day: string, ids: string[], preferredStart?: string | null) => {
      if (!slug) return;
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await getPublicMultiServiceBlockSlots(slug, ids, day);
        if (slotsRequestRef.current !== requestId) return;
        setSlots(
          result.slots
            .filter((slot): slot is typeof slot & { employeeId: string } => Boolean(slot.employeeId))
            .map((slot) => ({
              startTime: slot.startTime,
              employeeId: slot.employeeId,
              employeeName: slot.employeeName ?? '',
            })),
        );
        if (result.slots.length > 0) {
          const previousStart = preferredStart ?? selectedStartRef.current;
          const match = previousStart
            ? result.slots.find((slot) => slot.startTime === previousStart)
            : undefined;
          const chosen = match ?? result.slots[0]!;
          selectedStartRef.current = chosen.startTime;
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId ?? null);
          setMessage('');
        } else {
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch (err: unknown) {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setMessage((err as Error)?.message || copy.loadAvailableTimesFailed);
        }
      } finally {
        if (slotsRequestRef.current === requestId) setSlotsLoading(false);
      }
    },
    [copy.loadAvailableTimesFailed, slug],
  );

  useEffect(() => {
    if (!slug || !serviceSelectionKey) return;
    const requestId = ++suggestRequestRef.current;
    userPickedDateRef.current = false;
    selectedStartRef.current = null;
    setSelectedStart(null);
    setEmployeeId(null);
    setDateKey('');
    setSlots([]);
    setSlotProviders([]);
    setLaterProviders([]);
    setProviderPickerOpen(false);
    setPageLoading(true);
    setSlotsLoading(true);
    setMessage('');
    dateKeyRef.current = '';

    const ids = serviceSelectionKey.split(',');

    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceBlock(slug, ids);
        if (suggestRequestRef.current !== requestId) return;
        if (!userPickedDateRef.current) {
          setDateKey(suggested.dateKey);
          dateKeyRef.current = suggested.dateKey;
          selectedStartRef.current = suggested.startTime;
          setSelectedStart(suggested.startTime);
          setEmployeeId(suggested.employeeId);
        }
        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : suggested.dateKey;
        if (dayToLoad) {
          await loadDaySlots(
            dayToLoad,
            ids,
            userPickedDateRef.current ? null : suggested.startTime,
          );
        }
      } catch (err: unknown) {
        if (suggestRequestRef.current !== requestId) return;
        setMessage((err as Error)?.message || copy.findAvailableBlockFailed);
        const today = new Date().toISOString().slice(0, 10);
        if (!userPickedDateRef.current) {
          setDateKey(today);
          dateKeyRef.current = today;
        }
        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : today;
        if (dayToLoad) await loadDaySlots(dayToLoad, ids);
      } finally {
        if (suggestRequestRef.current === requestId) setPageLoading(false);
      }
    })();
  }, [copy.findAvailableBlockFailed, loadDaySlots, serviceSelectionKey, slug]);

  useEffect(() => {
    if (!slug || !selectedStart || serviceIds.length < 2) {
      setSlotProviders([]);
      setLaterProviders([]);
      return;
    }
    let cancelled = false;
    const ids = uniqueMultiServiceIds(serviceIds);
    void Promise.all([
      getPublicMultiServiceProviders(slug, ids, selectedStart, false),
      getPublicMultiServiceProviders(slug, ids, selectedStart, true),
    ])
      .then(([slotResult, laterResult]) => {
        if (cancelled) return;
        setSlotProviders(slotResult.providers);
        setLaterProviders(laterResult.providers);
      })
      .catch(() => {
        if (!cancelled) {
          setSlotProviders([]);
          setLaterProviders([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStart, serviceIds, slug]);

  const availableProviders = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; earliestStartTime?: string }>();
    for (const provider of slotProviders) byId.set(provider.id, provider);
    for (const provider of laterProviders) {
      if (!byId.has(provider.id)) byId.set(provider.id, provider);
    }
    return [...byId.values()];
  }, [laterProviders, slotProviders]);

  const selectedProviderName = useMemo(() => {
    if (employeeId) {
      const match = availableProviders.find((provider) => provider.id === employeeId);
      if (match?.name) return match.name;
    }
    return slots.find((slot) => slot.startTime === selectedStart)?.employeeName ?? '';
  }, [availableProviders, employeeId, selectedStart, slots]);

  const onContinue = () => {
    if (!slug || !selectedStart || !employeeId) return;
    const provider = availableProviders.find((entry) => entry.id === employeeId);
    history.push(
      buildMultiServiceCheckoutPath(slug, {
        services: uniqueMultiServiceIds(serviceIds).join(','),
        startTime: selectedStart,
        employeeId,
        ...(provider?.name ? { employeeName: provider.name } : {}),
      }),
    );
  };

  if (loading || servicesQuery.isLoading || pageLoading) {
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
  const turnover = profile.multiService?.turnoverBufferMinutes ?? 5;
  const totalDuration = sumMultiServiceDuration(selectedServices as Array<{ durationMinutes: number; bufferMinutes?: number }>, turnover);
  const totalPrice = sumMultiServicePrice(selectedServices as Array<{ price: number }>);
  const currency = resolveTenantPriceCurrency(selectedServices[0]?.currency, profile.currency);
  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildMultiServicePickerPath(slug, serviceIds)} />
          </IonButtons>
          <IonTitle>{copy.multiServiceAvailabilityTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.multiServicePickBlockHint}</p>

        <IonItem lines="none" button detail onClick={() => history.push(buildMultiServicePickerPath(slug, serviceIds))}>
          <IonLabel>
            <p style={{ fontSize: 12, color: '#6b7280' }}>{copy.servicesSection}</p>
            <h3>
              {formatCopy(copy.multiServiceCart, { count: selectedServices.length })} ·{' '}
              {formatCopy(copy.multiServiceTotal, {
                duration: totalDuration,
                price: formatPublicMoney(totalPrice, currency, profile.currency),
              })}
            </h3>
          </IonLabel>
        </IonItem>

        {(selectedProviderName || employeeId) && (
          <IonItem
            button
            detail={availableProviders.length > 1}
            onClick={() => availableProviders.length > 1 && setProviderPickerOpen((open) => !open)}
          >
            <IonLabel>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{copy.selectSpecialist}</p>
              <h3>{selectedProviderName || copy.selectSpecialist}</h3>
            </IonLabel>
          </IonItem>
        )}

        {providerPickerOpen ? (
          <IonList>
            {availableProviders.map((provider) => (
              <IonItem
                key={provider.id}
                button
                color={employeeId === provider.id ? 'primary' : undefined}
                onClick={() => {
                  setEmployeeId(provider.id);
                  if (
                    provider.earliestStartTime &&
                    provider.earliestStartTime !== selectedStartRef.current
                  ) {
                    selectedStartRef.current = provider.earliestStartTime;
                    setSelectedStart(provider.earliestStartTime);
                    const nextDate = toDateKey(provider.earliestStartTime, profile.timezone);
                    setDateKey(nextDate);
                    dateKeyRef.current = nextDate;
                  }
                  setProviderPickerOpen(false);
                }}
              >
                <IonLabel>
                  <h3>{provider.name}</h3>
                  {provider.earliestStartTime &&
                  provider.earliestStartTime !== selectedStart ? (
                    <p>{formatDateDisplay(provider.earliestStartTime, locale)}</p>
                  ) : null}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : null}

        <IonItem lines="none">
          <IonLabel position="stacked">Date</IonLabel>
          <IonDatetime
            presentation="date"
            min={minDate}
            value={dateKey}
            onIonChange={(e) => {
              const value = e.detail.value;
              if (typeof value !== 'string' || !serviceSelectionKey) return;
              userPickedDateRef.current = true;
              const nextDate = value.slice(0, 10);
              setDateKey(nextDate);
              dateKeyRef.current = nextDate;
              selectedStartRef.current = null;
              setSelectedStart(null);
              setEmployeeId(null);
              void loadDaySlots(nextDate, serviceSelectionKey.split(','), null);
            }}
          />
        </IonItem>

        {message ? <p style={{ color: '#b91c1c' }}>{message}</p> : null}

        {slotsLoading ? (
          <IonSpinner className="ion-margin-top" />
        ) : (
          <IonList>
            {slots.map((slot) => (
              <IonItem
                key={slot.startTime}
                button
                color={selectedStart === slot.startTime ? 'primary' : undefined}
                onClick={() => {
                  selectedStartRef.current = slot.startTime;
                  setSelectedStart(slot.startTime);
                  setEmployeeId(slot.employeeId);
                  setProviderPickerOpen(false);
                }}
              >
                <IonLabel>
                  {formatScheduleTime(slot.startTime, locale)}
                  {slot.employeeName ? ` · ${slot.employeeName}` : ''}
                </IonLabel>
              </IonItem>
            ))}
            {slots.length === 0 ? <p className="ion-padding">{copy.noTimesAvailable}</p> : null}
          </IonList>
        )}

        <IonButton
          expand="block"
          disabled={!selectedStart || !employeeId || slotsLoading}
          style={{ marginTop: 16, '--background': primary }}
          onClick={onContinue}
        >
          {copy.assistantContinueBooking}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
