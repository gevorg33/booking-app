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
import { useHistory, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  buildPackageCheckoutPath,
  buildPackagePickerPath,
  buildPackageLinesFromBlockStart,
  computePackageTotalDurationMinutes,
  expandPackageServiceItems,
} from '../lib/package-booking.js';
import { resolvePackageItemPricing } from '../lib/package-item-pricing.util.js';
import { toDateKey } from '../lib/multi-service-booking.js';
import {
  fetchPackageBlockSlots,
  fetchPackageProviders,
  fetchPublicPackage,
  suggestPackageBlock,
} from '../services/public-api.js';

export default function PackageConfirmPage() {
  const history = useHistory();
  const { slug, packageId } = useParams<{ slug: string; packageId: string }>();
  const { profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });

  const packageQuery = useQuery({
    queryKey: ['public-package', slug, packageId],
    queryFn: () => fetchPublicPackage(slug!, packageId!),
    enabled: Boolean(slug && packageId),
  });
  const pkg = packageQuery.data?.package;

  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<
    Array<{ startTime: string; employeeId: string; employeeName: string }>
  >([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
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

  const turnover = profile?.multiService?.turnoverBufferMinutes ?? 5;
  const expandedItems = useMemo(() => (pkg ? expandPackageServiceItems(pkg) : []), [pkg]);
  const pricedItems = useMemo(() => (pkg ? resolvePackageItemPricing(pkg) : []), [pkg]);
  const totalDuration = useMemo(
    () => (pkg ? computePackageTotalDurationMinutes(pkg, turnover) : 0),
    [pkg, turnover],
  );

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      if (!slug || !packageId) return;
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await fetchPackageBlockSlots(slug, packageId, day);
        if (slotsRequestRef.current !== requestId) return;
        const normalized = (result.slots ?? []).map((slot) => ({
          startTime: slot.startTime,
          employeeId: slot.employeeId ?? '',
          employeeName: slot.employeeName ?? '',
        }));
        setSlots(normalized);
        if (normalized.length > 0) {
          const previousStart = preferredStart ?? selectedStartRef.current;
          const match = previousStart
            ? normalized.find((slot) => slot.startTime === previousStart)
            : undefined;
          const chosen = match ?? normalized[0];
          selectedStartRef.current = chosen.startTime;
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId);
          setEmployeeName(chosen.employeeName);
          setMessage('');
        } else {
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setEmployeeName(null);
        }
      } catch (err: unknown) {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setEmployeeName(null);
          setMessage((err as Error)?.message || copy.loadAvailableTimesFailed);
        }
      } finally {
        if (slotsRequestRef.current === requestId) {
          setSlotsLoading(false);
        }
      }
    },
    [copy.loadAvailableTimesFailed, packageId, slug],
  );

  useEffect(() => {
    if (!slug || !packageId) return;
    const requestId = ++suggestRequestRef.current;
    userPickedDateRef.current = false;
    selectedStartRef.current = null;
    setSelectedStart(null);
    setEmployeeId(null);
    setEmployeeName(null);
    setDateKey('');
    setSlots([]);
    setSlotProviders([]);
    setLaterProviders([]);
    setProviderPickerOpen(false);
    setPageLoading(true);
    setSlotsLoading(true);
    setMessage('');
    dateKeyRef.current = '';

    void (async () => {
      try {
        const suggested = await suggestPackageBlock(slug, packageId);
        if (suggestRequestRef.current !== requestId) return;

        if (!userPickedDateRef.current) {
          setDateKey(suggested.dateKey);
          dateKeyRef.current = suggested.dateKey;
          selectedStartRef.current = suggested.startTime;
          setSelectedStart(suggested.startTime);
          setEmployeeId(suggested.employeeId);
          setEmployeeName(suggested.employeeName);
        }

        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : suggested.dateKey;
        if (dayToLoad) {
          await loadDaySlots(
            dayToLoad,
            userPickedDateRef.current ? null : suggested.startTime,
          );
        }
      } catch (err: unknown) {
        if (suggestRequestRef.current !== requestId) return;
        setMessage((err as Error)?.message || copy.packageNoBlock);
        const today = new Date().toISOString().slice(0, 10);
        if (!userPickedDateRef.current) {
          setDateKey(today);
          dateKeyRef.current = today;
        }
        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : today;
        if (dayToLoad) {
          await loadDaySlots(dayToLoad);
        }
      } finally {
        if (suggestRequestRef.current === requestId) setPageLoading(false);
      }
    })();
  }, [copy.packageNoBlock, loadDaySlots, packageId, slug]);

  useEffect(() => {
    if (!selectedStart || !slug || !packageId) {
      setSlotProviders([]);
      setLaterProviders([]);
      return;
    }

    let cancelled = false;
    void Promise.all([
      fetchPackageProviders(slug, packageId, selectedStart, false),
      fetchPackageProviders(slug, packageId, selectedStart, true),
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
  }, [packageId, selectedStart, slug]);

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
    return employeeName ?? slots.find((slot) => slot.startTime === selectedStart)?.employeeName ?? '';
  }, [availableProviders, employeeId, employeeName, selectedStart, slots]);

  const sequentialLines = useMemo(() => {
    if (!selectedStart || !employeeId) return [];
    return buildPackageLinesFromBlockStart(expandedItems, selectedStart, employeeId, turnover);
  }, [employeeId, expandedItems, selectedStart, turnover]);

  const onContinue = () => {
    if (!slug || !packageId || !selectedStart || !employeeId || sequentialLines.length === 0) return;
    history.push(
      buildPackageCheckoutPath(slug, packageId, {
        lines: sequentialLines,
        employeeName: selectedProviderName || undefined,
      }),
    );
  };

  if (loading || packageQuery.isLoading || pageLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !packageId || !pkg) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || copy.networkLoadFailed}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';
  const minDate = new Date().toISOString().slice(0, 10);
  const tz = profile.timezone || 'UTC';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildPackagePickerPath(slug)} />
          </IonButtons>
          <IonTitle>{copy.schedulePackage}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{copy.packageScheduleEach}</p>

        <IonItem lines="none">
          <IonLabel>
            <h2 style={{ fontWeight: 600 }}>{pkg.name}</h2>
            <p>
              {formatCopy(copy.multiServiceTotal, {
                duration: totalDuration,
                price: formatPublicMoney(pkg.pricing.packagePrice, pkg.currency, profile.currency),
              })}
            </p>
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
                  setEmployeeName(provider.name);
                  if (
                    provider.earliestStartTime &&
                    provider.earliestStartTime !== selectedStartRef.current
                  ) {
                    selectedStartRef.current = provider.earliestStartTime;
                    setSelectedStart(provider.earliestStartTime);
                    const nextDate = toDateKey(provider.earliestStartTime, tz);
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
          <IonLabel position="stacked">{copy.dateLabel}</IonLabel>
          <IonDatetime
            presentation="date"
            min={minDate}
            value={dateKey}
            onIonChange={(e) => {
              const value = e.detail.value;
              if (typeof value !== 'string') return;
              userPickedDateRef.current = true;
              const nextDate = value.slice(0, 10);
              setDateKey(nextDate);
              dateKeyRef.current = nextDate;
              selectedStartRef.current = null;
              setSelectedStart(null);
              setEmployeeId(null);
              setEmployeeName(null);
              void loadDaySlots(nextDate, null);
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
                  setEmployeeName(slot.employeeName);
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

        {expandedItems.length > 0 ? (
          <IonList>
            {expandedItems.map((item, index) => {
              const priced = pricedItems.find((entry) => entry.serviceId === item.serviceId);
              return (
                <IonItem key={`${item.serviceId}-${index}`} lines="none">
                  <IonLabel>
                    <h3>{item.serviceName}</h3>
                    <p>
                      {item.durationMinutes + item.bufferMinutes} min
                      {priced
                        ? ` · ${formatPublicMoney(
                            priced.discountedLineTotal / Math.max(priced.quantity, 1),
                            pkg.currency,
                            profile.currency,
                          )}`
                        : ''}
                    </p>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        ) : null}

        <IonButton
          expand="block"
          disabled={!selectedStart || !employeeId || slotsLoading || sequentialLines.length === 0}
          style={{ marginTop: 16, '--background': primary }}
          onClick={onContinue}
        >
          {copy.packageContinueCheckout}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
