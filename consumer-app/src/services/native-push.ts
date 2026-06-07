import { Capacitor } from '@capacitor/core';
import {
  dispatchConsumerPushNavigation,
  parseConsumerPushPayload,
  shouldShowConsumerForegroundPush,
} from '../lib/consumer-native-push.util.js';
import {
  fetchConsumerNativePushStatus,
  registerConsumerNativePush,
} from './public-api.js';
import { getCustomerToken } from '../lib/customer-auth.js';

const PUSH_OPT_IN_KEY = 'consumer-push-opt-in';
const PUSH_TOKEN_KEY = 'consumer-fcm-token';

export function isFcmBuild(): boolean {
  return import.meta.env.VITE_FCM_CONFIGURED === 'true';
}

export interface ConsumerNativePushStatus {
  registered: boolean;
  platform: 'ios' | 'android' | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

let listenersAttached = false;
let activeSlug: string | null = null;

function markPushOptIn(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(PUSH_OPT_IN_KEY, 'true');
  } else {
    localStorage.removeItem(PUSH_OPT_IN_KEY);
  }
}

function hasLocalPushOptIn(): boolean {
  return localStorage.getItem(PUSH_OPT_IN_KEY) === 'true';
}

function cacheFcmToken(token: string): void {
  localStorage.setItem(PUSH_TOKEN_KEY, token);
}

function getCachedFcmToken(): string | null {
  return localStorage.getItem(PUSH_TOKEN_KEY);
}

function isLikelyEnabled(
  registered: boolean,
  permission: ConsumerNativePushStatus['permission'],
): boolean {
  return registered || (permission === 'granted' && hasLocalPushOptIn());
}

async function uploadTokenToBackend(slug: string, token: string): Promise<boolean> {
  try {
    await registerConsumerNativePush(slug, token, Capacitor.getPlatform());
    cacheFcmToken(token);
    markPushOptIn(true);
    return true;
  } catch (err) {
    console.error('Failed to register consumer push token with backend', err);
    return false;
  }
}

async function attachPushListeners(slug: string): Promise<void> {
  activeSlug = slug;
  if (listenersAttached || !Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  await PushNotifications.addListener('registration', async (token) => {
    const targetSlug = activeSlug;
    if (!targetSlug || !getCustomerToken(targetSlug)) return;
    await uploadTokenToBackend(targetSlug, token.value);
  });

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('Consumer push registration error', err);
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    const payload = parseConsumerPushPayload(
      (notification.data ?? {}) as Record<string, unknown>,
    );
    if (!shouldShowConsumerForegroundPush(payload)) return;
    const title = notification.title ?? payload.foregroundHint ?? 'Clinic update';
    const body = notification.body ?? payload.foregroundHint ?? '';
    if (typeof window !== 'undefined' && body) {
      console.info(`[consumer-push] ${title}: ${body}`);
    }
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const payload = parseConsumerPushPayload(
      (action.notification.data ?? {}) as Record<string, unknown>,
    );
    if (payload.url) {
      dispatchConsumerPushNavigation(payload.url);
    }
  });

  listenersAttached = true;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.createChannel({
    id: 'clinic_alerts',
    name: 'Clinic alerts',
    description: 'Lab results and collection booking reminders',
    importance: 5,
    visibility: 1,
  });
}

export async function getConsumerNativePushStatus(
  slug: string,
): Promise<ConsumerNativePushStatus> {
  const platform = Capacitor.getPlatform();
  if (!Capacitor.isNativePlatform() || (platform !== 'android' && platform !== 'ios')) {
    return { registered: false, platform: null, permission: 'unknown' };
  }

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  const permission =
    perm.receive === 'granted' ? 'granted' : perm.receive === 'denied' ? 'denied' : 'prompt';

  if (!getCustomerToken(slug)) {
    return { registered: false, platform: platform as 'ios' | 'android', permission };
  }

  try {
    const data = await fetchConsumerNativePushStatus(slug, platform);
    if (data.registered) markPushOptIn(true);
    return {
      registered: isLikelyEnabled(data.registered, permission),
      platform: (data.platform as ConsumerNativePushStatus['platform']) ?? (platform as 'ios' | 'android'),
      permission,
    };
  } catch {
    return {
      registered: isLikelyEnabled(false, permission),
      platform: platform as 'ios' | 'android',
      permission,
    };
  }
}

export async function syncConsumerNativePushToken(slug: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) return;

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') return;

  await ensureAndroidChannel();
  await attachPushListeners(slug);

  let backendRegistered = false;
  try {
    const data = await fetchConsumerNativePushStatus(slug, platform);
    backendRegistered = data.registered;
  } catch {
    // Server unavailable — still try to refresh token below.
  }

  await PushNotifications.register();

  if (!backendRegistered) {
    const cached = getCachedFcmToken();
    if (cached) {
      const ok = await uploadTokenToBackend(slug, cached);
      if (!ok) localStorage.removeItem(PUSH_TOKEN_KEY);
    }
  }
}

export type EnableConsumerNativePushResult = 'ok' | 'denied' | 'timeout' | 'error';

export async function enableConsumerNativePush(
  slug: string,
): Promise<EnableConsumerNativePushResult> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) {
    return 'error';
  }

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return 'error';

  const { PushNotifications } = await import('@capacitor/push-notifications');

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return 'denied';

  markPushOptIn(true);
  await ensureAndroidChannel();
  await attachPushListeners(slug);
  await PushNotifications.register();

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const data = await fetchConsumerNativePushStatus(slug, platform);
      if (data.registered) return 'ok';
    } catch {
      // keep polling
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  if (hasLocalPushOptIn() && getCachedFcmToken()) return 'ok';
  return 'timeout';
}
