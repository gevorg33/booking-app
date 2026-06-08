import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useCachedTenantServices } from '../hooks/use-cached-tenant-services.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import { isOfflineQueuedPayload } from '../lib/consumer-offline-response.util.js';
import { ConsumerNetworkErrorCard } from '../components/ConsumerNetworkErrorCard.js';
import { ConsumerOfflineBanner } from '../components/ConsumerOfflineBanner.js';
import { CheckoutTaxSummary } from '../components/CheckoutTaxSummary.js';
import type { PublicCheckoutQuote } from '../lib/types.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
  setCustomerSession,
} from '../lib/customer-auth.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { track, getOrCreateAnonId } from '../lib/app-analytics.js';
import { consumeReferralConversionFlag } from '../lib/consumer-referral.util.js';
import { shareBookingLink } from '../lib/consumer-growth-loops.util.js';
import { readRebookLaunchContext } from '../lib/consumer-rebook.util.js';
import { rememberBookedSalon } from '../lib/recent-salons.js';
import {
  incrementCompletedBookingCount,
  getCompletedBookingCount,
} from '../lib/store-review-prompt.util.js';
import { computeBookingSuccessEndTime } from '../lib/checkout-recommendations.js';
import {
  resolveSlotPreselection,
} from '../lib/guided-booking-flow.util.js';
import {
  buildPreConfirmSignInStorageKey,
  resolveActivationPathVariants,
  shouldAutoPreselectNearestSlot,
  shouldPromptPreConfirmSignIn,
} from '../lib/activation-path-ab.util.js';
import { loadActivationPathPromotedFromRemote } from '../lib/activation-path-ab-remote.util.js';
import { formatBookingDateTimeRange } from '../lib/date-format.js';
import { ConsumerCheckoutIntakeStep } from '../components/ConsumerCheckoutIntakeStep.js';
import { ConsumerProductRecommendationCards } from '../components/ConsumerProductRecommendationCards.js';
import { ConsumerCheckoutContactForm } from '../components/ConsumerCheckoutContactForm.js';
import { BookingProgressIndicator } from '../components/BookingProgressIndicator.js';
import { PushOptInPrimingPrompt } from '../components/PushOptInPrimingPrompt.js';
import { PushProvisionalUpgradePrompt } from '../components/PushProvisionalUpgradePrompt.js';
import {
  notifyHighValuePushMoment,
} from '../lib/push-denied-reask.util.js';
import {
  notifyPostBookingSignInCompleted,
  PostBookingSignInPrompt,
} from '../components/PostBookingSignInPrompt.js';
import { useConsumerOneTapSignIn } from '../hooks/use-consumer-one-tap-sign-in.js';
import {
  clearBookingDraft,
  loadBookingDraft,
  saveBookingDraft,
} from '../lib/booking-draft.util.js';
import {
  buildBookingAbandonmentProps,
} from '../lib/activation-instrumentation.util.js';
import {
  buildBookPageConfirmStepProps,
  buildBookPageStartedBookingProps,
  shouldTrackConfirmStep,
} from '../lib/qualified-install-funnel.util.js';
import { readDeferredInstallResumeContext } from '../lib/deferred-install-resume.util.js';
import {
  buildBookingDraftResumeCopy,
  readBookingDraftResumeContext,
} from '../lib/booking-draft-resume.util.js';
import {
  loadRememberedCheckoutContact,
  resolveCheckoutContactPrefill,
  saveRememberedCheckoutContact,
} from '../lib/checkout-autofill.util.js';
import {
  clearPendingCheckoutPayment,
  loadPendingCheckoutPayment,
  requiresOnlinePayment,
  savePendingCheckoutPayment,
  showCashPaymentOption,
  type CheckoutPaymentMethod,
} from '../lib/checkout-payment.util.js';
import {
  normalizeGuestContact,
  resolveCheckoutContact,
  validateGuestCheckoutContact,
  type GuestCheckoutContact,
} from '../lib/guest-booking.util.js';
import {
  recordPushPrimingDecision,
} from '../lib/push-opt-in-priming.util.js';
import {
  isValueFirstPrimingEligible,
  resolvePostBookingPushFlow,
  shouldRequestOsPushPermissionBeforePriming,
} from '../lib/value-first-push-priming.util.js';
import {
  bookingCompletedAsGuest,
  shouldPromptPostBookingSignIn,
} from '../lib/post-booking-sign-in.util.js';
import {
  buildActivationPaymentCopy,
  isActivationBookingPath,
  resolveActivationPaymentAnalyticsProps,
  resolveActivationPaymentMethod,
  resolveCheckoutAmountLabel,
  shouldAutoRetryWithPayAtVenue,
  shouldPreferPayAtVenueForActivation,
  shouldShowPaymentHiccupFallback,
} from '../lib/activation-payment.util.js';
import { isAppleSignInAvailable } from '../services/apple-auth.js';
import { isGoogleSignInAvailable } from '../services/google-auth.js';
import { buildPushReachabilityAnalyticsProps } from '../lib/push-reachability.util.js';
import {
  acceptProvisionalToFullUpgrade,
  acceptValueFirstPushPriming,
  getConsumerNativePushStatus,
  isFcmBuild,
  requestAndroidPostBookingNotificationPermission,
  readConsumerPushPermissionState,
} from '../services/native-push.js';
import {
  confirmPublicBookingPayment,
  createBooking,
  createPublicBookingCheckout,
  fetchNearestBookableSlot,
  fetchPublicProviders,
  fetchServiceSlots,
  quotePublicBooking,
} from '../services/public-api.js';

function openExternalCheckout(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank', 'noopener,noreferrer');
}

function applyBookingSuccess(
  ctx: {
    slug: string;
    service: { id: string; durationMinutes: number; name: string };
    profile: { name: string; branding: { logoUrl?: string } };
    slot: string;
    checkoutQuote: PublicCheckoutQuote | null | undefined;
    customer: GuestCheckoutContact;
    queryClient: ReturnType<typeof useQueryClient>;
    clinicOrderToken?: string;
    setBookingSuccess: (value: {
      bookingId: string;
      startTime: string;
      endTime: string;
      quote: PublicCheckoutQuote | null;
    }) => void;
    setShowPushPriming: (value: boolean) => void;
    bookingCompletedRef: MutableRefObject<boolean>;
  },
  bookingId: string,
): void {
  const {
    slug,
    service,
    profile,
    slot,
    checkoutQuote,
    customer,
    queryClient,
    clinicOrderToken,
    setBookingSuccess,
    setShowPushPriming,
    bookingCompletedRef,
  } = ctx;

  saveRememberedCheckoutContact(slug, customer);
  setBookingSuccess({
    bookingId,
    startTime: slot,
    endTime: computeBookingSuccessEndTime(slot, service.durationMinutes),
    quote: checkoutQuote ?? null,
  });
  track('completed_booking', { bookingId, serviceId: service.id });
  if (consumeReferralConversionFlag(slug)) {
    track('referral_converted', { bookingId, serviceId: service.id, slug });
  }
  bookingCompletedRef.current = true;
  clearBookingDraft();
  clearPendingCheckoutPayment();
  rememberBookedSalon({
    slug,
    name: profile.name,
    logoUrl: profile.branding.logoUrl,
  });
  void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
  if (clinicOrderToken) {
    void queryClient.invalidateQueries({
      queryKey: ['clinic-lab-booking-requests', slug],
    });
  }
  const completedCount = incrementCompletedBookingCount();
  void completedCount;
}

export default function BookPage() {
  const { serviceId } = useParams<{ slug: string; serviceId: string }>();
  const location = useLocation();
  const clinicOrderToken = useMemo(() => {
    const value = new URLSearchParams(location.search).get('clinicOrderToken');
    return value?.trim() || undefined;
  }, [location.search]);
  const { slug, profile, loading, error, fromCache } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug, profile ?? { locale: 'en' });
  const queryClient = useQueryClient();
  const resumeParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const resumePrefill = useMemo(() => {
    const resumeDate = resumeParams.get('date')?.slice(0, 10);
    const resumeSlot = resumeParams.get('slot') ?? '';
    const resumeEmployeeId = resumeParams.get('employeeId') ?? '';
    return {
      date: resumeDate ?? new Date().toISOString().slice(0, 10),
      slot: resumeSlot,
      employeeId: resumeEmployeeId,
      rebook: readRebookLaunchContext(location.search),
    };
  }, [location.search, resumeParams]);
  const deferredResume = useMemo(
    () => readDeferredInstallResumeContext(location.search, resumePrefill.slot),
    [location.search, resumePrefill.slot],
  );
  const bookingResume = useMemo(
    () =>
      readBookingDraftResumeContext({
        search: location.search,
        slug: slug ?? '',
        serviceId: serviceId ?? '',
        slot: resumePrefill.slot,
        draft: loadBookingDraft(),
      }),
    [location.search, slug, serviceId, resumePrefill.slot],
  );
  const skipSlotDiscovery =
    deferredResume.skipSlotDiscovery || bookingResume.skipSlotDiscovery;
  const collapseScheduleUi =
    deferredResume.collapseScheduleUi || bookingResume.collapseScheduleUi;
  const [date, setDate] = useState(() => resumePrefill.date);
  const [employeeId, setEmployeeId] = useState(() => resumePrefill.employeeId);
  const [slot, setSlot] = useState(() => resumePrefill.slot);
  const [nearestAttempted, setNearestAttempted] = useState(
    () =>
      resumePrefill.rebook.isRebook ||
      Boolean(resumePrefill.slot) ||
      skipSlotDiscovery,
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<{
    bookingId: string;
    startTime: string;
    endTime: string;
    quote: PublicCheckoutQuote | null;
  } | null>(null);
  const [showPushPriming, setShowPushPriming] = useState(false);
  const [showProvisionalUpgrade, setShowProvisionalUpgrade] = useState(false);
  const [postBookingSignInDismissed, setPostBookingSignInDismissed] = useState(false);
  const [postBookingSignedIn, setPostBookingSignedIn] = useState(false);
  const [preConfirmSignInDismissed, setPreConfirmSignInDismissed] = useState(false);
  const [preConfirmSignedIn, setPreConfirmSignedIn] = useState(false);
  const [activationPathRefresh, setActivationPathRefresh] = useState(0);
  const [sharingBooking, setSharingBooking] = useState(false);
  const [presentToast] = useIonToast();
  const guestBookingRef = useRef(false);
  const [guestContact, setGuestContact] = useState<GuestCheckoutContact>(() =>
    normalizeGuestContact({}),
  );
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('online');
  const [awaitingPaymentReturn, setAwaitingPaymentReturn] = useState(false);
  const bookingCompletedRef = useRef(false);
  const contactPrefilledRef = useRef(false);
  const rebookTrackedRef = useRef(false);
  const startedBookingTrackedRef = useRef(false);
  const confirmStepTrackedRef = useRef(false);
  const slotAutoSelectedRef = useRef(
    Boolean(resumePrefill.slot) || deferredResume.isResume || bookingResume.isResume,
  );
  const [checkoutFailed, setCheckoutFailed] = useState(false);

  const {
    data: services = [],
    isError: servicesError,
    refetch: refetchServices,
    isFetching: servicesFetching,
  } = useCachedTenantServices(slug ?? '');
  const service = services.find((s) => s.id === serviceId);

  const { data: providers = [] } = useQuery({
    queryKey: ['providers', slug],
    queryFn: () => fetchPublicProviders(slug!),
    enabled: !!slug,
  });

  const {
    data: slots = [],
    isLoading: slotsLoading,
    isError: slotsError,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['slots', slug, serviceId, date],
    queryFn: () => fetchServiceSlots(slug!, serviceId!, date),
    enabled: !!slug && !!serviceId && !!date,
    retry: 2,
  });

  const { data: checkoutQuote } = useQuery({
    queryKey: ['booking-quote', slug, serviceId],
    queryFn: () => quotePublicBooking(slug!, { serviceId: serviceId! }),
    enabled: !!slug && !!serviceId && !bookingSuccess,
  });

  const [bookingPhase, setBookingPhase] = useState<'schedule' | 'intake'>('schedule');
  const [preVisitIntakeId, setPreVisitIntakeId] = useState<string | undefined>();

  const profileStored = slug ? getStoredCustomerProfile(slug) : null;
  const authed = slug ? !!getCustomerToken(slug) : false;
  const activationPathVariants = useMemo(
    () => resolveActivationPathVariants(getOrCreateAnonId()),
    [activationPathRefresh],
  );

  const postBookingOneTapSignIn = useConsumerOneTapSignIn(slug, {
    onSuccess: (result) => {
      if (!bookingSuccess) return;
      track('signed_in');
      notifyPostBookingSignInCompleted(
        bookingSuccess.bookingId,
        result.provider === 'apple' ? 'apple' : 'google',
      );
      setPostBookingSignedIn(true);
      void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
      void presentToast({ message: copy.postBookingSignInTitle, duration: 2500 });
    },
  });

  const preConfirmOneTapSignIn = useConsumerOneTapSignIn(slug, {
    onSuccess: () => {
      track('signed_in');
      setPreConfirmSignedIn(true);
      if (slug) {
        void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
      }
      void presentToast({ message: copy.postBookingSignInTitle, duration: 2500 });
    },
  });

  useEffect(() => {
    void loadActivationPathPromotedFromRemote().then((promoted) => {
      if (Object.keys(promoted).length > 0) {
        setActivationPathRefresh((value) => value + 1);
      }
    });
  }, []);

  useEffect(() => {
    if (!bookingSuccess || !slug) return;
    void (async () => {
      const completedBookingCount = getCompletedBookingCount();
      const isNative = Capacitor.isNativePlatform();
      const fcmBuild = isFcmBuild();
      const status = await getConsumerNativePushStatus(slug);
      const primingEligible = isValueFirstPrimingEligible({
        completedBookingCount,
        isNative,
        isFcmBuild: fcmBuild,
        permission: status.permission,
      });

      if (
        shouldRequestOsPushPermissionBeforePriming({
          platform: Capacitor.getPlatform(),
          completedBookingCount,
          permission: status.permission,
          isNative,
          isFcmBuild: fcmBuild,
          primingEligible,
        })
      ) {
        await requestAndroidPostBookingNotificationPermission(slug);
      }

      notifyHighValuePushMoment({ slug, completedBookingCount });

      const step = resolvePostBookingPushFlow({
        platform: Capacitor.getPlatform(),
        completedBookingCount,
        isNative,
        isFcmBuild: fcmBuild,
        permission: status.permission,
      });

      if (step === 'provisional_upgrade') {
        setShowProvisionalUpgrade(true);
      } else if (step === 'value_first_priming') {
        setShowPushPriming(true);
      }
    })();
  }, [bookingSuccess, slug]);

  useEffect(() => {
    if (!slug || !serviceId || rebookTrackedRef.current || !resumePrefill.rebook.isRebook) return;
    rebookTrackedRef.current = true;
    track('rebooked', {
      bookingId: resumePrefill.rebook.bookingId ?? 'unknown',
      slug,
      serviceId,
      source: resumePrefill.rebook.source,
    });
  }, [resumePrefill.rebook, serviceId, slug]);

  useEffect(() => {
    if (!skipSlotDiscovery) return;
    setNearestAttempted(true);
  }, [skipSlotDiscovery]);

  useEffect(() => {
    if (!bookingResume.isResume || !slug || !serviceId) return;
    track('onboarding_step_viewed', {
      onboardingStep: bookingResume.abandonedStep,
      serviceId,
      firstRunRedirect: 'abandonment_resume',
    });
  }, [bookingResume.abandonedStep, bookingResume.isResume, serviceId, slug]);

  useEffect(() => {
    if (!deferredResume.isResume || !slug || !serviceId) return;
    track('onboarding_step_viewed', {
      onboardingStep: 'confirm',
      serviceId,
      firstRunRedirect: 'deferred_link',
    });
  }, [deferredResume.isResume, serviceId, slug]);

  useEffect(() => {
    if (!slug || !serviceId || startedBookingTrackedRef.current) return;
    startedBookingTrackedRef.current = true;
    track(
      'started_booking',
      buildBookPageStartedBookingProps(
        serviceId,
        deferredResume.isResume ? { firstRunRedirect: 'deferred_link' } : undefined,
      ),
    );
  }, [deferredResume.isResume, serviceId, slug]);

  useEffect(() => {
    if (!serviceId || confirmStepTrackedRef.current) return;
    if (!shouldTrackConfirmStep({ slot })) return;
    confirmStepTrackedRef.current = true;
    track(
      'onboarding_step_viewed',
      buildBookPageConfirmStepProps(
        serviceId,
        deferredResume.isResume ? { firstRunRedirect: 'deferred_link' } : undefined,
      ),
    );
  }, [deferredResume.isResume, serviceId, slot]);

  useEffect(() => {
    if (!slug || authed || contactPrefilledRef.current) return;
    contactPrefilledRef.current = true;
    const draft = loadBookingDraft();
    setGuestContact(
      resolveCheckoutContactPrefill({
        profile: profileStored,
        draft: draft?.slug === slug ? draft.guestContact : null,
        remembered: loadRememberedCheckoutContact(slug),
      }),
    );
  }, [slug, authed, profileStored]);

  const confirmPendingPayment = useCallback(async () => {
    if (!slug || !serviceId) return false;
    const sessionFromUrl = resumeParams.get('session_id');
    const pending = loadPendingCheckoutPayment(slug);
    const sessionId = sessionFromUrl?.trim() || pending?.sessionId;
    if (!sessionId) return false;
    if (pending && pending.serviceId !== serviceId) return false;

    setSubmitting(true);
    setMessage('');
    try {
      const result = await confirmPublicBookingPayment(slug, sessionId);
      guestBookingRef.current = bookingCompletedAsGuest(!!getCustomerToken(slug));
      if (result.customer) {
        const token = getCustomerToken(slug);
        setCustomerSession(slug, token, result.customer);
      }
      const customer = normalizeGuestContact({
        name: result.customer.name,
        email: result.customer.email ?? '',
        phone: result.customer.phone ?? '',
      });
      applyBookingSuccess(
        {
          slug,
          service: service ?? { id: serviceId, durationMinutes: 60, name: '' },
          profile: profile ?? { name: slug, branding: {} },
          slot: pending?.startTime ?? slot,
          checkoutQuote,
          customer,
          queryClient,
          clinicOrderToken,
          setBookingSuccess,
          setShowPushPriming,
          bookingCompletedRef,
        },
        (result.booking as { id: string }).id,
      );
      setAwaitingPaymentReturn(false);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    slug,
    serviceId,
    resumeParams,
    service,
    profile,
    slot,
    checkoutQuote,
    queryClient,
    clinicOrderToken,
  ]);

  useEffect(() => {
    if (!slug || !serviceId) return;
    void confirmPendingPayment();
  }, [slug, serviceId, confirmPendingPayment]);

  useEffect(() => {
    if (!slug || !Capacitor.isNativePlatform() || !awaitingPaymentReturn) return;
    const handle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void confirmPendingPayment();
    });
    return () => {
      void handle.then((listener) => listener.remove());
    };
  }, [slug, awaitingPaymentReturn, confirmPendingPayment]);

  useEffect(() => {
    if (!slug || !serviceId || skipSlotDiscovery) return;
    if (
      !shouldAutoPreselectNearestSlot({
        slotPreselection: activationPathVariants.slotPreselection,
        nearestAttempted,
        slot,
      })
    ) {
      return;
    }
    let cancelled = false;
    void fetchNearestBookableSlot(slug, serviceId, employeeId || undefined)
      .then((nearest) => {
        if (cancelled) return;
        setNearestAttempted(true);
        const selection = resolveSlotPreselection({
          nearest,
          slots: [],
          currentDate: date,
        });
        if (!selection) return;
        setDate(selection.date);
        setSlot(selection.slot);
        slotAutoSelectedRef.current = true;
        if (selection.employeeId) setEmployeeId(selection.employeeId);
        track('onboarding_step_viewed', { onboardingStep: 'slot', serviceId });
      })
      .catch(() => {
        if (!cancelled) setNearestAttempted(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, employeeId, nearestAttempted, slot, date, skipSlotDiscovery, activationPathVariants.slotPreselection]);

  useEffect(() => {
    if (skipSlotDiscovery) return;
    if (!nearestAttempted || slot || slotsLoading || slots.length === 0) return;
    const selection = resolveSlotPreselection({
      nearest: null,
      slots,
      currentDate: date,
    });
    if (!selection) return;
    setSlot(selection.slot);
    slotAutoSelectedRef.current = true;
    track('onboarding_step_viewed', { onboardingStep: 'slot', serviceId: serviceId! });
  }, [skipSlotDiscovery, nearestAttempted, slot, slotsLoading, slots, date, serviceId]);

  useEffect(() => {
    if (!slug || !serviceId) return;
    saveBookingDraft({
      slug,
      serviceId,
      employeeId: employeeId || undefined,
      date,
      slot: slot || undefined,
      guestContact: authed ? undefined : guestContact,
    });
  }, [slug, serviceId, employeeId, date, slot, guestContact, authed]);

  useEffect(() => {
    return () => {
      if (bookingCompletedRef.current || !slug || !serviceId) return;
      if (!slot && !guestContact.name.trim()) return;
      track(
        'booking_abandoned',
        buildBookingAbandonmentProps({
          serviceId,
          abandonedStep: slot ? 'confirm' : guestContact.name.trim() ? 'slot' : 'service',
          date,
          slot: slot || undefined,
          employeeId: employeeId || undefined,
        }),
      );
    };
  }, [slug, serviceId, slot, guestContact.name, date, employeeId]);

  useEffect(() => {
    if (!profile || !service) return;
    const cash = showCashPaymentOption(profile, service, checkoutQuote ?? null);
    const activation = isActivationBookingPath({
      completedBookingCount: getCompletedBookingCount(),
      isDeferredResume: deferredResume.isResume,
    });
    if (!cash || !activation) return;
    setPaymentMethod((current) =>
      resolveActivationPaymentMethod({
        isActivationPath: activation,
        cashAvailable: cash,
        currentMethod: current,
        paymentTiming: activationPathVariants.paymentTiming,
      }),
    );
  }, [profile, service, checkoutQuote, deferredResume.isResume, activationPathVariants.paymentTiming]);

  const showIntakeStep = Boolean(service?.offersPreVisitIntake && authed);

  const minDate = useMemo(() => new Date().toISOString(), []);

  if (loading || (servicesFetching && !service && services.length === 0)) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={slug ? buildSalonPath(slug, '/services') : '/'} />
            </IonButtons>
            <IonTitle>Book</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
          <ConsumerNetworkErrorCard
            message={error || copy.networkLoadFailed}
            retryLabel={copy.networkRetryAction}
            onRetry={() => window.location.reload()}
          />
        </IonContent>
      </IonPage>
    );
  }

  if (!service) {
    const loadFailed = servicesError && services.length === 0;
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
            </IonButtons>
            <IonTitle>Book</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
          {loadFailed ? (
            <ConsumerNetworkErrorCard
              message={copy.networkLoadFailed}
              retryLabel={copy.networkRetryAction}
              onRetry={() => void refetchServices()}
            />
          ) : (
            <>
              <p>Service not found</p>
              <IonButton expand="block" fill="outline" routerLink={buildSalonPath(slug, '/services')}>
                {copy.bookAnotherService}
              </IonButton>
            </>
          )}
        </IonContent>
      </IonPage>
    );
  }

  const completedBookingCount = getCompletedBookingCount();
  const isActivationPath = isActivationBookingPath({
    completedBookingCount,
    isDeferredResume: deferredResume.isResume,
  });
  const cashAvailable = showCashPaymentOption(profile, service, checkoutQuote ?? null);
  const activationPaymentCopy = buildActivationPaymentCopy(locale);
  const showPaymentHiccupFallback = shouldShowPaymentHiccupFallback({
    isActivationPath,
    cashAvailable,
    awaitingPaymentReturn,
    checkoutFailed,
  });
  const preferPayAtVenue = shouldPreferPayAtVenueForActivation({
    isActivationPath,
    cashAvailable,
    paymentTiming: activationPathVariants.paymentTiming,
  });
  const showPreConfirmSignIn = shouldPromptPreConfirmSignIn({
    signInPlacement: activationPathVariants.signInPlacement,
    wasGuestAtBooking: true,
    hasExistingSession: authed || preConfirmSignedIn,
    hasOneTapProvider: isGoogleSignInAvailable() || isAppleSignInAvailable(),
    dismissed: preConfirmSignInDismissed,
    slotSelected: Boolean(slot),
  });

  const submitBooking = async (
    linkedIntakeId?: string,
    options?: { paymentOverride?: CheckoutPaymentMethod },
  ) => {
    if (!slug || !slot) return;
    const customer = resolveCheckoutContact(profileStored, guestContact);
    const validationError = customer
      ? validateGuestCheckoutContact(customer)
      : 'Enter your contact details to book.';
    if (!customer || validationError) {
      setMessage(validationError ?? 'Enter your contact details to book.');
      return;
    }
    const method = options?.paymentOverride ?? paymentMethod;
    setSubmitting(true);
    setMessage('');
    try {
      guestBookingRef.current = bookingCompletedAsGuest(!!getCustomerToken(slug));
      const bookingBody = {
        serviceId: service.id,
        employeeId: employeeId || providers[0]?.id || '',
        startTime: slot,
        ...(linkedIntakeId ?? preVisitIntakeId
          ? { preVisitIntakeId: linkedIntakeId ?? preVisitIntakeId }
          : {}),
        ...(clinicOrderToken ? { clinicOrderToken } : {}),
        ...(method === 'cash' ? { paymentMethod: 'cash' as const } : {}),
        customer: {
          name: customer.name,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
        },
      };

      if (requiresOnlinePayment(service, checkoutQuote, method)) {
        try {
          const checkout = await createPublicBookingCheckout(slug, bookingBody);
          savePendingCheckoutPayment({
            slug,
            sessionId: checkout.sessionId,
            serviceId: service.id,
            startTime: slot,
          });
          setAwaitingPaymentReturn(true);
          setCheckoutFailed(false);
          openExternalCheckout(checkout.url);
          setMessage('Complete payment in your browser, then return here to confirm your booking.');
          return;
        } catch (checkoutErr: unknown) {
          if (
            shouldAutoRetryWithPayAtVenue({
              isActivationPath,
              cashAvailable,
              checkoutFailed: true,
            })
          ) {
            setCheckoutFailed(true);
            setPaymentMethod('cash');
            track(
              'activation_payment_fallback',
              resolveActivationPaymentAnalyticsProps({
                serviceId: service.id,
                paymentMethod: 'cash',
                fallbackReason: 'checkout_failed',
              }),
            );
            setMessage(activationPaymentCopy.hiccupMessage);
            return submitBooking(linkedIntakeId, { paymentOverride: 'cash' });
          }
          throw checkoutErr;
        }
      }

      const result = await createBooking(slug, bookingBody);
      if (isOfflineQueuedPayload(result)) {
        setMessage(copy.offlineMutationQueued);
        return;
      }
      if (result.customer) {
        const token = getCustomerToken(slug);
        setCustomerSession(slug, token, result.customer);
      }
      setCheckoutFailed(false);
      setAwaitingPaymentReturn(false);
      applyBookingSuccess(
        {
          slug,
          service,
          profile,
          slot,
          checkoutQuote,
          customer,
          queryClient,
          clinicOrderToken,
          setBookingSuccess,
          setShowPushPriming,
          bookingCompletedRef,
        },
        result.booking.id,
      );
    } catch (err: unknown) {
      setMessage(formatFriendlyNetworkError(err, copy.networkLoadFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = (linkedIntakeId?: string) => submitBooking(linkedIntakeId);

  const completeWithPayAtVenueFallback = async () => {
    if (!cashAvailable || !isActivationPath) return;
    clearPendingCheckoutPayment();
    setAwaitingPaymentReturn(false);
    setCheckoutFailed(false);
    setPaymentMethod('cash');
    track(
      'activation_payment_fallback',
      resolveActivationPaymentAnalyticsProps({
        serviceId: service.id,
        paymentMethod: 'cash',
        fallbackReason: 'payment_return',
      }),
    );
    await submitBooking(undefined, { paymentOverride: 'cash' });
  };

  const confirmButtonLabel = (() => {
    if (submitting) return 'Booking…';
    if (awaitingPaymentReturn) return 'Complete payment…';
    if (showIntakeStep && bookingPhase === 'schedule') return copy.publicIntakeContinueToBooking;
    const kind = resolveCheckoutAmountLabel({
      quote: checkoutQuote ?? null,
      service,
      paymentMethod,
      isActivationPath,
    });
    if (kind === 'pay_online') return 'Pay & confirm booking';
    if (kind === 'pay_at_visit') return copy.activationPayAtVisitConfirm;
    return isActivationPath ? copy.activationConfirmBooking : 'Confirm booking';
  })();

  if (bookingSuccess) {
    const showPostBookingSignIn = shouldPromptPostBookingSignIn({
      wasGuestAtBooking: guestBookingRef.current,
      hasExistingSession: authed || postBookingSignedIn,
      hasOneTapProvider: isGoogleSignInAvailable() || isAppleSignInAvailable(),
      dismissed: postBookingSignInDismissed,
      signInPlacement: activationPathVariants.signInPlacement,
    });
    const successGuestContact = normalizeGuestContact(guestContact);

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
            </IonButtons>
            <IonTitle>{service.name}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '2rem auto 1rem',
            }}
            aria-hidden
          >
            ✓
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{copy.bookingConfirmed}</h2>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.875rem' }}>
            {formatBookingDateTimeRange(
              bookingSuccess.startTime,
              bookingSuccess.endTime,
              locale,
            )}
          </p>
          <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.875rem', maxWidth: 320, marginInline: 'auto' }}>
            {copy.bookingConfirmedHint}
          </p>
          {bookingSuccess.quote && (
            <div style={{ maxWidth: 360, margin: '16px auto 0' }}>
              <CheckoutTaxSummary
                quote={bookingSuccess.quote}
                currency={bookingSuccess.quote.currency}
                tenantCurrency={profile.currency}
                labels={{
                  subtotal: copy.checkoutSubtotal,
                  totalDue: copy.checkoutTotalDue,
                  taxIncluded: copy.taxIncluded,
                }}
              />
            </div>
          )}
          <ConsumerProductRecommendationCards
            slug={slug}
            service={service}
            tenantCurrency={profile.currency}
            bookingId={bookingSuccess.bookingId}
            copy={copy}
          />
          {showPostBookingSignIn ? (
            <PostBookingSignInPrompt
              slug={slug}
              bookingId={bookingSuccess.bookingId}
              locale={locale}
              guestContact={successGuestContact}
              busy={postBookingOneTapSignIn.busy}
              message={postBookingOneTapSignIn.message}
              onSignInWithGoogle={postBookingOneTapSignIn.signInWithGoogle}
              onSignInWithApple={postBookingOneTapSignIn.signInWithApple}
              onSkipped={() => setPostBookingSignInDismissed(true)}
            />
          ) : null}
          <IonButton
            expand="block"
            className="ion-margin-top"
            routerLink={buildSalonPath(slug, '/account')}
          >
            {copy.viewAppointments}
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            className="ion-margin-top"
            routerLink={buildSalonPath(slug, '/services')}
          >
            {copy.bookAnotherService}
          </IonButton>
          {profile && service && bookingSuccess ? (
            <IonButton
              expand="block"
              fill="outline"
              className="ion-margin-top"
              disabled={sharingBooking}
              onClick={() => {
                void (async () => {
                  setSharingBooking(true);
                  try {
                    const result = await shareBookingLink({
                      slug,
                      businessName: profile.name,
                      booking: {
                        id: bookingSuccess.bookingId,
                        serviceId: service.id,
                        serviceName: service.name,
                        employeeId: employeeId || providers[0]?.id || '',
                      },
                    });
                    if (result === 'copied') {
                      await presentToast({ message: copy.growthShareCopied, duration: 2000 });
                    } else if (result === 'unavailable') {
                      await presentToast({
                        message: copy.growthShareUnavailable,
                        duration: 2500,
                      });
                    }
                  } finally {
                    setSharingBooking(false);
                  }
                })();
              }}
            >
              <IonIcon slot="start" icon={shareOutline} />
              {copy.growthShareBookingAction}
            </IonButton>
          ) : null}
          <PushOptInPrimingPrompt
            isOpen={showPushPriming}
            locale={locale}
            onAccept={() => {
              recordPushPrimingDecision('accepted');
              setShowPushPriming(false);
              void acceptValueFirstPushPriming(slug).then((result) => {
                track(
                  'push_priming_accepted',
                  buildPushReachabilityAnalyticsProps({
                    permissionState: 'full',
                    pushOptIn: result === 'ok',
                  }),
                );
              });
            }}
            onDecline={() => {
              recordPushPrimingDecision('declined');
              track(
                'push_priming_declined',
                buildPushReachabilityAnalyticsProps({
                  permissionState: readConsumerPushPermissionState(),
                  pushOptIn: false,
                }),
              );
              setShowPushPriming(false);
            }}
          />
          <PushProvisionalUpgradePrompt
            isOpen={showProvisionalUpgrade}
            locale={locale}
            onAccept={() => {
              setShowProvisionalUpgrade(false);
              void acceptProvisionalToFullUpgrade(slug);
            }}
            onDecline={() => setShowProvisionalUpgrade(false)}
          />
        </IonContent>
      </IonPage>
    );
  }

  if (bookingPhase === 'intake' && showIntakeStep) {
    return (
      <ConsumerCheckoutIntakeStep
        slug={slug}
        serviceId={service.id}
        copy={copy}
        onSkip={() => {
          setBookingPhase('schedule');
          void submit();
        }}
        onCompleted={(intakeId) => {
          setPreVisitIntakeId(intakeId);
          setBookingPhase('schedule');
          void submit(intakeId);
        }}
      />
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
          </IonButtons>
          <IonTitle>{service.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
        <BookingProgressIndicator pathname={location.pathname} slotSelected={Boolean(slot)} />

        {!authed ? (
          <>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>
              {bookingResume.isResume
                ? buildBookingDraftResumeCopy(bookingResume.abandonedStep, locale)
                : deferredResume.isResume
                  ? 'Your time is reserved — confirm your booking below.'
                  : 'Book as a guest — sign in later and we will keep your appointments.'}
            </p>
            <ConsumerCheckoutContactForm value={guestContact} onChange={setGuestContact} />
          </>
        ) : bookingResume.isResume ? (
          <p style={{ color: '#6b7280', marginBottom: 8 }}>
            {buildBookingDraftResumeCopy(bookingResume.abandonedStep, locale)}
          </p>
        ) : null}

        {collapseScheduleUi && slot ? (
          <div
            className="ion-margin-bottom"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: '#f3f4f6',
              color: '#374151',
              fontSize: '0.9375rem',
            }}
          >
            <strong>Selected time</strong>
            <div style={{ marginTop: 4 }}>
              {formatBookingDateTimeRange(
                slot,
                computeBookingSuccessEndTime(slot, service.durationMinutes),
                locale,
              )}
            </div>
          </div>
        ) : (
          <>
        <IonItem lines="none">
          <IonLabel position="stacked">Date</IonLabel>
          <IonDatetime
            presentation="date"
            min={minDate}
            value={date}
            onIonChange={(e) => {
              const v = e.detail.value;
              if (typeof v === 'string') setDate(v.slice(0, 10));
            }}
          />
        </IonItem>

        {providers.length > 0 && (
          <IonItem>
            <IonLabel>Specialist</IonLabel>
            <IonSelect
              value={employeeId}
              placeholder="Any available"
              onIonChange={(e) => setEmployeeId(String(e.detail.value ?? ''))}
            >
              <IonSelectOption value="">Any available</IonSelectOption>
              {providers.map((p) => (
                <IonSelectOption key={p.id} value={p.id}>
                  {p.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}

        {slotsLoading ? (
          <IonSpinner className="ion-margin-top" />
        ) : slotsError ? (
          <ConsumerNetworkErrorCard
            compact
            message={copy.networkLoadFailed}
            retryLabel={copy.networkRetryAction}
            onRetry={() => void refetchSlots()}
          />
        ) : (
          <IonList className="ion-margin-top">
            {slots.map((s) => (
              <IonItem
                key={s.startTime}
                button
                color={slot === s.startTime ? 'primary' : undefined}
                onClick={() => setSlot(s.startTime)}
              >
                <IonLabel>
                  {new Date(s.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </IonLabel>
              </IonItem>
            ))}
            {slots.length === 0 && <p className="ion-padding">No times available this day.</p>}
          </IonList>
        )}
          </>
        )}

        {!authed ? null : (
          <p style={{ color: '#6b7280', marginTop: 16 }}>
            Signed in as {profileStored?.name}. Your appointment will appear under Account.
          </p>
        )}

        {checkoutQuote && (
          <CheckoutTaxSummary
            quote={checkoutQuote}
            currency={checkoutQuote.currency}
            tenantCurrency={profile.currency}
            labels={{
              subtotal: copy.checkoutSubtotal,
              totalDue: copy.checkoutTotalDue,
              taxIncluded: copy.taxIncluded,
            }}
          />
        )}

        {cashAvailable ? (
          <div className="ion-margin-top">
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Payment</p>
            {preferPayAtVenue && paymentMethod === 'cash' ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 8 }}>
                {activationPaymentCopy.optionalHint}
              </p>
            ) : null}
            {preferPayAtVenue && paymentMethod === 'cash' ? (
              <p style={{ color: '#374151', fontSize: '0.8125rem', marginBottom: 8 }}>
                {activationPaymentCopy.payAtVenueSelected}
              </p>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <IonButton
                expand="block"
                fill={paymentMethod === 'online' ? 'solid' : 'outline'}
                onClick={() => setPaymentMethod('online')}
              >
                Pay online
              </IonButton>
              <IonButton
                expand="block"
                fill={paymentMethod === 'cash' ? 'solid' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
              >
                Pay at visit
              </IonButton>
            </div>
          </div>
        ) : null}

        {showPaymentHiccupFallback ? (
          <div
            className="ion-margin-top"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: '#fff7ed',
              color: '#9a3412',
              fontSize: '0.875rem',
            }}
          >
            <p style={{ margin: 0 }}>{activationPaymentCopy.hiccupMessage}</p>
            <IonButton
              expand="block"
              className="ion-margin-top"
              fill="outline"
              disabled={submitting}
              onClick={() => void completeWithPayAtVenueFallback()}
            >
              {activationPaymentCopy.payAtVenueFallbackAction}
            </IonButton>
          </div>
        ) : null}

        {awaitingPaymentReturn ? (
          <p className="ion-margin-top" style={{ color: '#6b7280' }}>
            Waiting for payment — return here after checkout.{' '}
            <IonButton fill="clear" size="small" onClick={() => void confirmPendingPayment()}>
              Refresh status
            </IonButton>
          </p>
        ) : null}

        {showPreConfirmSignIn ? (
          <PostBookingSignInPrompt
            slug={slug}
            bookingId={buildPreConfirmSignInStorageKey(slug, service.id)}
            locale={locale}
            guestContact={normalizeGuestContact(guestContact)}
            busy={preConfirmOneTapSignIn.busy}
            message={preConfirmOneTapSignIn.message}
            onSignInWithGoogle={preConfirmOneTapSignIn.signInWithGoogle}
            onSignInWithApple={preConfirmOneTapSignIn.signInWithApple}
            onSkipped={() => setPreConfirmSignInDismissed(true)}
          />
        ) : null}

        <IonButton
          expand="block"
          className="ion-margin-top"
          disabled={!slot || submitting}
          onClick={() => {
            if (showIntakeStep && bookingPhase === 'schedule') {
              setBookingPhase('intake');
              return;
            }
            void submit();
          }}
        >
          {confirmButtonLabel}
        </IonButton>
        {message ? (
          <ConsumerNetworkErrorCard
            compact
            message={message}
            retryLabel={copy.networkRetryAction}
            onRetry={() => void submit()}
          />
        ) : null}
      </IonContent>
    </IonPage>
  );
}
