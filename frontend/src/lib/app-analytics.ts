import axios from 'axios';
import { hasAcceptedCookies } from './cookie-consent';
import {
  bootstrapColdAnalyticsSession,
  buildAnalyticsDeviceContext,
  markWarmAnalyticsSession,
  resetAnalyticsSessionContextForTests,
  resolveAppAnalyticsPlatform,
} from './app-analytics-context.util';

export type AppAnalyticsEvent =
  | 'app_installed'
  | 'app_opened'
  | 'signed_in'
  | 'viewed_salon'
  | 'started_booking'
  | 'completed_booking'
  | 'rebooked'
  | 'referral_sent';

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
}

interface QueuedEvent {
  event: AppAnalyticsEvent;
  props?: AppAnalyticsEventProps;
}

const ANON_ID_PREFIX = 'app-analytics-anon-id-';
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 10;

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
}

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

export {
  bootstrapColdAnalyticsSession,
  markWarmAnalyticsSession,
  resolveAppAnalyticsPlatform,
} from './app-analytics-context.util';

export function anonIdStorageKey(tenantSlug: string): string {
  return `${ANON_ID_PREFIX}${tenantSlug}`;
}

export function getOrCreateAnonId(tenantSlug: string): string {
  const storage = getStorage();
  const key = anonIdStorageKey(tenantSlug);
  const existing = storage?.getItem(key);
  if (existing) return existing;
  const created = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  storage?.setItem(key, created);
  return created;
}

export function syncAnalyticsConsentFromCookies(tenantSlug: string): boolean {
  consentGranted = hasAcceptedCookies(tenantSlug);
  return consentGranted;
}

export function configureAppAnalytics(next: AppAnalyticsContext): void {
  context = next;
  if (next.tenantSlug) {
    syncAnalyticsConsentFromCookies(next.tenantSlug);
  }
}

export function markAppAnalyticsWarmStart(): void {
  markWarmAnalyticsSession();
}

export function buildAppAnalyticsEventBody(
  item: QueuedEvent,
  ctx: AppAnalyticsContext,
) {
  const tenantSlug = ctx.tenantSlug ?? 'unknown';
  const device = buildAnalyticsDeviceContext(ctx, tenantSlug);
  return {
    event: item.event,
    anonId: getOrCreateAnonId(tenantSlug),
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

export async function flushAppAnalytics(): Promise<void> {
  if (!context || !consentGranted || queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH_SIZE);
  const body = buildAppAnalyticsIngestBody(context, batch);
  try {
    await axios.post(`${getApiBaseUrl()}/events/app`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
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
