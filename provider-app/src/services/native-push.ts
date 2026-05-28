import { Capacitor } from '@capacitor/core';
import api, { unwrap } from './api';

const PUSH_OPT_IN_KEY = 'provider-push-opt-in';
const PUSH_TOKEN_KEY = 'provider-fcm-token';

export function isFcmBuild(): boolean {
  return import.meta.env.VITE_FCM_CONFIGURED === 'true';
}

export interface NativePushStatus {
  registered: boolean;
  platform: 'ios' | 'android' | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

let listenersAttached = false;
let activeBusinessId: string | null = null;

function markPushOptIn(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(PUSH_OPT_IN_KEY, 'true');
  } else {
    localStorage.removeItem(PUSH_OPT_IN_KEY);
  }
}

function hasLocalPushOptIn(): boolean {
  return localStorage.getItem(PUSH_OPT_IN_KEY) === 'true';
}

function cacheFcmToken(token: string) {
  localStorage.setItem(PUSH_TOKEN_KEY, token);
}

function getCachedFcmToken(): string | null {
  return localStorage.getItem(PUSH_TOKEN_KEY);
}

function isLikelyEnabled(registered: boolean, permission: NativePushStatus['permission']): boolean {
  return registered || (permission === 'granted' && hasLocalPushOptIn());
}

async function uploadTokenToBackend(businessId: string, token: string): Promise<boolean> {
  try {
    await api.post(`/businesses/${businessId}/provider/push/register-native`, {
      token,
      platform: Capacitor.getPlatform(),
    });
    cacheFcmToken(token);
    markPushOptIn(true);
    return true;
  } catch (err) {
    console.error('Failed to register push token with backend', err);
    return false;
  }
}

async function attachPushListeners(businessId: string): Promise<void> {
  activeBusinessId = businessId;
  if (listenersAttached || !Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  await PushNotifications.addListener('registration', async (token) => {
    const targetBusinessId = activeBusinessId;
    if (!targetBusinessId) return;
    await uploadTokenToBackend(targetBusinessId, token.value);
  });

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error', err);
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground', notification);
  });

  listenersAttached = true;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.createChannel({
    id: 'booking_alerts',
    name: 'Booking alerts',
    description: 'New appointment notifications',
    importance: 5,
    visibility: 1,
  });
}

export async function getNativePushStatus(businessId: string): Promise<NativePushStatus> {
  const platform = Capacitor.getPlatform();
  if (!Capacitor.isNativePlatform() || (platform !== 'android' && platform !== 'ios')) {
    return { registered: false, platform: null, permission: 'unknown' };
  }

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  const permission =
    perm.receive === 'granted' ? 'granted' : perm.receive === 'denied' ? 'denied' : 'prompt';

  try {
    const res = await api.get<{ registered: boolean; platform: string | null }>(
      `/businesses/${businessId}/provider/push/native-status`,
      { params: { platform } },
    );
    const data = unwrap<{ registered: boolean; platform: string | null }>(res.data);
    if (data.registered) markPushOptIn(true);
    return {
      registered: isLikelyEnabled(data.registered, permission),
      platform: (data.platform as NativePushStatus['platform']) ?? (platform as 'ios' | 'android'),
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

export async function syncNativePushToken(businessId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild()) return;

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') return;

  await ensureAndroidChannel();
  await attachPushListeners(businessId);

  let backendRegistered = false;
  try {
    const res = await api.get<{ registered: boolean }>(
      `/businesses/${businessId}/provider/push/native-status`,
      { params: { platform } },
    );
    backendRegistered = unwrap<{ registered: boolean }>(res.data).registered;
  } catch {
    // Server unavailable — still try to refresh token below.
  }

  await PushNotifications.register();

  if (!backendRegistered) {
    const cached = getCachedFcmToken();
    if (cached) {
      const ok = await uploadTokenToBackend(businessId, cached);
      if (!ok) localStorage.removeItem(PUSH_TOKEN_KEY);
    }
  }
}

export async function ensurePushRegistered(businessId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild()) return false;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') return false;

  await syncNativePushToken(businessId);

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await api.get<{ registered: boolean }>(
        `/businesses/${businessId}/provider/push/native-status`,
        { params: { platform: Capacitor.getPlatform() } },
      );
      if (unwrap<{ registered: boolean }>(res.data).registered) return true;
    } catch {
      // Server may still be starting — keep polling.
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  return false;
}

export type EnableNativePushResult = 'ok' | 'denied' | 'timeout' | 'error';

export async function enableNativePush(businessId: string): Promise<EnableNativePushResult> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild()) return 'error';

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
  await attachPushListeners(businessId);
  await PushNotifications.register();

  const registered = await ensurePushRegistered(businessId);
  if (registered) return 'ok';
  if (hasLocalPushOptIn() && getCachedFcmToken()) return 'ok';
  return 'timeout';
}
