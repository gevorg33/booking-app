import { Capacitor } from '@capacitor/core';
import { recordAppAnalyticsEvents } from '../services/api';
import {
  bootstrapColdAnalyticsSession,
  buildAnalyticsDeviceContext,
  markWarmAnalyticsSession,
  resetAnalyticsSessionContextForTests,
} from './app-analytics-context.util';

export type AppAnalyticsEvent =
  | 'app_installed'
  | 'app_opened'
  | 'signed_in'
  | 'viewed_salon'
  | 'started_booking'
  | 'completed_booking'
  | 'rebooked'
  | 'referral_sent'
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
  referralCode?: string;
  pushOptIn?: boolean;
  crashFree?: boolean;
  salonViewCount?: number;
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

export { resolveAppAnalyticsPlatform } from './app-analytics-context.util';
export {
  bootstrapColdAnalyticsSession,
  hydrateAnalyticsAppVersion,
  markWarmAnalyticsSession,
} from './app-analytics-context.util';

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

export function trackAppAnalyticsEvent(
  event: AppAnalyticsEvent,
  props?: AppAnalyticsEventProps,
): void {
  if (!context || !consentGranted) return;
  queue.push({ event, props });
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
  track('app_installed');
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
