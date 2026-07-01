import { Capacitor } from '@capacitor/core';
import { recordAppAnalyticsEvents } from '../services/public-api.js';
import {
  bootstrapColdAnalyticsSession,
  buildAnalyticsDeviceContext,
  markWarmAnalyticsSession,
  resetAnalyticsSessionContextForTests,
} from './app-analytics-context.util.js';
import {
  buildInstallAttributionProps,
  peekDeferredInstallLink,
} from './deferred-install-link.util.js';
import { readStoredOnboardingVariant } from './onboarding-variant.util.js';
import {
  buildActivationPathAnalyticsProps,
  readStoredActivationPathVariants,
  resolveActivationPathVariants,
} from './activation-path-ab.util.js';

export type AppAnalyticsEvent =
  | 'app_installed'
  | 'app_opened'
  | 'signed_in'
  | 'viewed_salon'
  | 'started_booking'
  | 'completed_booking'
  | 'rebooked'
  | 'referral_sent'
  | 'referral_accepted'
  | 'referral_converted'
  | 'salon_shared'
  | 'booking_shared'
  | 'review_prompt_shown'
  | 'tenant_review_submitted'
  | 'store_review_opened'
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'booking_abandoned'
  | 'booking_resumed'
  | 'push_priming_shown'
  | 'push_priming_accepted'
  | 'push_priming_declined'
  | 'push_reachability_registered'
  | 'push_permission_upgraded'
  | 'push_settings_reask_shown'
  | 'push_provisional_upgrade_shown'
  | 'push_token_refreshed'
  | 'push_delivery_ack'
  | 'share_reward_claimed'
  | 'post_booking_sign_in_shown'
  | 'post_booking_sign_in_completed'
  | 'post_booking_sign_in_skipped'
  | 'activation_payment_fallback'
  | 'app_interactive';

export type AppAnalyticsSurface = 'consumer_app' | 'provider_app' | 'public_web';

export type AppAnalyticsPlatform = 'ios' | 'android' | 'web';

export type AppAnalyticsStartType = 'cold' | 'warm';

export type AppAnalyticsUserType = 'first_open' | 'returning';

export interface AppAnalyticsContext {
  businessId?: string;
  tenantSlug?: string;
  locale?: string;
  appVersion?: string;
  appSurface: AppAnalyticsSurface;
}

export interface AppAnalyticsEventProps {
  bookingId?: string;
  serviceId?: string;
  slug?: string;
  channel?: string;
  provider?: string;
  referralCode?: string;
  pushOptIn?: boolean;
  pushReachability?: boolean;
  pushReachabilityScope?: string;
  pushPermissionState?: string;
  pushReminders?: boolean;
  pushTokenRefresh?: boolean;
  pushDeliveryAck?: boolean;
  platform?: string;
  rating?: number;
  deliveryId?: string;
  source?: string;
  crashFree?: boolean;
  salonViewCount?: number;
  installSource?: string;
  campaign?: string;
  onboardingVariant?: string;
  onboardingStep?: string;
  firstRunRedirect?: string;
  abandonedStep?: string;
  signInPlacement?: string;
  slotPreselection?: string;
  paymentTiming?: string;
  startupMs?: number;
  ttiBudgetMs?: number;
  lowEndAndroid?: boolean;
}

interface QueuedEvent {
  event: AppAnalyticsEvent;
  props?: AppAnalyticsEventProps;
}

const ANON_ID_KEY = 'app-analytics-anon-id';
const CONSENT_KEY = 'app-analytics-consent';
export const CONSUMER_DECLINE_ANALYTICS_CONSENT_EVENT =
  'consumer:decline-analytics-consent';
const INSTALLED_KEY = 'app-analytics-installed';
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 10;

let context: AppAnalyticsContext | null = null;
let consentGranted = false;
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

bootstrapColdAnalyticsSession();

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export { resolveAppAnalyticsPlatform } from './app-analytics-context.util.js';
export {
  bootstrapColdAnalyticsSession,
  hydrateAnalyticsAppVersion,
  markWarmAnalyticsSession,
} from './app-analytics-context.util.js';

export function getOrCreateAnonId(): string {
  const storage = getStorage();
  const existing = storage?.getItem(ANON_ID_KEY);
  if (existing) return existing;
  const created = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  storage?.setItem(ANON_ID_KEY, created);
  return created;
}

export function readAnalyticsConsent(): boolean | null {
  const storage = getStorage();
  const raw = storage?.getItem(CONSENT_KEY);
  if (raw === 'granted') return true;
  if (raw === 'denied') return false;
  return null;
}

export function setAnalyticsConsent(granted: boolean): void {
  consentGranted = granted;
  getStorage()?.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  if (granted) {
    trackAppInstalledOnce();
    track('app_opened');
    if (queue.length > 0) void flushAppAnalytics();
  }
}

export function declineConsumerAnalyticsConsent(): void {
  setAnalyticsConsent(false);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSUMER_DECLINE_ANALYTICS_CONSENT_EVENT));
  }
}

export function configureAppAnalytics(next: AppAnalyticsContext): void {
  context = { ...context, ...next, appSurface: next.appSurface ?? context?.appSurface ?? next.appSurface };
  const storedConsent = readAnalyticsConsent();
  if (storedConsent != null) consentGranted = storedConsent;
  if (consentGranted && hasTenantContext(context) && queue.length > 0) {
    void flushAppAnalytics();
  }
}

function hasTenantContext(ctx: AppAnalyticsContext | null): boolean {
  return Boolean(ctx?.businessId?.trim() || ctx?.tenantSlug?.trim());
}

/** @deprecated use markWarmAnalyticsSession */
export function markAppAnalyticsWarmStart(): void {
  markWarmAnalyticsSession();
}

export function buildAppAnalyticsEventBody(
  item: QueuedEvent,
  ctx: AppAnalyticsContext,
) {
  const device = buildAnalyticsDeviceContext(ctx);
  return {
    event: item.event,
    anonId: getOrCreateAnonId(),
    platform: device.platform,
    appSurface: ctx.appSurface,
    appVersion: device.appVersion,
    locale: device.locale,
    tenantSlug: device.tenantSlug,
    sessionId: device.sessionId,
    startType: device.startType,
    userType: device.userType,
    props: item.props,
  };
}

export function buildAppAnalyticsIngestBody(
  ctx: AppAnalyticsContext,
  events: QueuedEvent[],
) {
  return {
    businessId: ctx.businessId,
    tenantSlug: ctx.tenantSlug,
    consentGranted: true,
    events: events.map((event) => buildAppAnalyticsEventBody(event, ctx)),
  };
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAppAnalytics();
  }, FLUSH_INTERVAL_MS);
}

function enrichActivationEventProps(
  props?: AppAnalyticsEventProps,
): AppAnalyticsEventProps | undefined {
  const variant = props?.onboardingVariant ?? readStoredOnboardingVariant() ?? undefined;
  const storedPath = readStoredActivationPathVariants();
  const pathProps = buildActivationPathAnalyticsProps(
    storedPath ?? resolveActivationPathVariants(getOrCreateAnonId()),
  );
  if (!variant && !props) return pathProps;
  return { ...props, ...pathProps, ...(variant ? { onboardingVariant: variant } : {}) };
}

export function trackAppAnalyticsEvent(
  event: AppAnalyticsEvent,
  props?: AppAnalyticsEventProps,
): void {
  if (!context || !consentGranted) return;
  queue.push({ event, props: enrichActivationEventProps(props) });
  if (queue.length >= MAX_BATCH_SIZE) {
    void flushAppAnalytics();
    return;
  }
  scheduleFlush();
}

export const track = trackAppAnalyticsEvent;

export function trackAppInstalledOnce(): void {
  const storage = getStorage();
  if (!Capacitor.isNativePlatform() || storage?.getItem(INSTALLED_KEY)) return;
  storage?.setItem(INSTALLED_KEY, '1');

  const deferred = peekDeferredInstallLink();
  if (deferred?.slug) {
    configureAppAnalytics({
      appSurface: 'consumer_app',
      tenantSlug: deferred.slug,
    });
  }

  const props = buildInstallAttributionProps(deferred);
  track('app_installed', props);
}

export async function flushAppAnalytics(): Promise<void> {
  if (!context || !consentGranted || queue.length === 0 || !hasTenantContext(context)) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const body = buildAppAnalyticsIngestBody(context, batch);
  try {
    await recordAppAnalyticsEvents(body);
    if (queue.length > 0) scheduleFlush();
  } catch {
    queue.unshift(...batch);
  }
}

export function resetAppAnalyticsForTests(): void {
  context = null;
  consentGranted = false;
  queue = [];
  resetAnalyticsSessionContextForTests();
  bootstrapColdAnalyticsSession();
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
