import { Capacitor } from '@capacitor/core';
import {
  dispatchConsumerPushEffects,
  parseConsumerPushPayload,
  shouldShowConsumerForegroundPush,
} from '../lib/consumer-native-push.util.js';
import { showConsumerForegroundPushBanner } from '../lib/consumer-push-foreground.util.js';
import {
  buildAndroidDefaultOnReachabilityAnalyticsProps,
  persistAndroidDefaultOnPermissionState,
  shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen,
} from '../lib/android-post-booking-push.util.js';
import {
  buildProvisionalToFullUpgradeAcceptedAnalyticsProps,
  notifyProvisionalPushEngaged,
  shouldMarkProvisionalPushEngaged,
} from '../lib/provisional-to-full-push.util.js';
import {
  buildPushReachabilityAnalyticsProps,
  hasRegisteredPushReachability,
  isAndroidDefaultOnReachable,
  mapCapacitorPermission,
  markAndroidPostBookingPermissionRequested,
  markProvisionalPushEngaged,
  markPushReachabilityRegistered,
  persistIosProvisionalPermissionState,
  shouldRequestAndroidPostBookingPermission,
  type PushPermissionState,
} from '../lib/push-reachability.util.js';
import {
  buildIosProvisionalReachabilityAnalyticsProps,
  resolveIosProvisionalPermissionState,
  shouldEnsureIosProvisionalReachabilityOnFirstOpen,
} from '../lib/ios-provisional-push.util.js';
import {
  fetchConsumerNativePushStatus,
  registerConsumerNativePush,
  ackConsumerPushDelivery,
} from './public-api.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { getOrCreateAnonId, track } from '../lib/app-analytics.js';
import { getCompletedBookingCount } from '../lib/store-review-prompt.util.js';
import {
  buildPushDeliveryAckAnalyticsProps,
  buildPushTokenRefreshAnalyticsProps,
  readPushDeliveryId,
  shouldAckPushDelivery,
  shouldRefreshCachedPushToken,
} from '../lib/push-deliverability.util.js';
import {
  buildAndroidPushChannelSyncSpecs,
  type AndroidPushChannelSyncSpec,
} from '../lib/n99-push-channel.util.js';
import type { ConsumerNotificationPreferences } from '../lib/consumer-notification-preferences.util.js';
import { normalizeConsumerNotificationPreferences } from '../lib/consumer-notification-preferences.util.js';
import { PUSH_PERMISSION_STATE_KEY } from '../lib/push-reachability.fixtures.js';

const PUSH_OPT_IN_KEY = 'consumer-push-opt-in';
const PUSH_TOKEN_KEY = 'consumer-fcm-token';

export function isFcmBuild(): boolean {
  return import.meta.env.VITE_FCM_CONFIGURED === 'true';
}

export interface ConsumerNativePushStatus {
  registered: boolean;
  platform: 'ios' | 'android' | null;
  permission: PushPermissionState;
}

let listenersAttached = false;
let activeSlug: string | null = null;

export function readActiveConsumerPushSlug(): string | null {
  return activeSlug;
}

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

function readStoredPermissionState(): PushPermissionState | null {
  const raw = localStorage.getItem(PUSH_PERMISSION_STATE_KEY);
  if (
    raw === 'full' ||
    raw === 'provisional' ||
    raw === 'default_on' ||
    raw === 'denied' ||
    raw === 'prompt'
  ) {
    return raw;
  }
  return null;
}

function persistPermissionState(state: PushPermissionState): void {
  localStorage.setItem(PUSH_PERMISSION_STATE_KEY, state);
}

function isLikelyEnabled(
  registered: boolean,
  permission: PushPermissionState,
): boolean {
  return (
    registered ||
    permission === 'full' ||
    permission === 'provisional' ||
    permission === 'default_on' ||
    (permission === 'full' && hasLocalPushOptIn())
  );
}

async function uploadTokenToBackend(
  slug: string,
  token: string,
  permissionState: PushPermissionState,
): Promise<boolean> {
  try {
    const previous = getCachedFcmToken();
    const refreshed = shouldRefreshCachedPushToken(previous, token);
    await registerConsumerNativePush(
      slug,
      token,
      Capacitor.getPlatform(),
      getOrCreateAnonId(),
      permissionState,
    );
    cacheFcmToken(token);
    persistPermissionState(permissionState);
    if (permissionState === 'full') markPushOptIn(true);
    if (refreshed) {
      track(
        'push_token_refreshed',
        buildPushTokenRefreshAnalyticsProps(Capacitor.getPlatform()),
      );
    }
    return true;
  } catch (err) {
    console.error('Failed to register consumer push token with backend', err);
    return false;
  }
}

async function ackPushDeliveryIfPresent(
  slug: string,
  data: Record<string, unknown> | undefined,
): Promise<void> {
  const deliveryId = readPushDeliveryId(data);
  if (!shouldAckPushDelivery(deliveryId)) return;
  const platform = Capacitor.getPlatform();
  if (platform !== 'ios' && platform !== 'android') return;
  try {
    await ackConsumerPushDelivery(slug, deliveryId!, platform);
    track('push_delivery_ack', buildPushDeliveryAckAnalyticsProps(deliveryId!, platform));
  } catch (err) {
    console.warn('Failed to ack consumer push delivery', err);
  }
}

function trackReachabilityRegistered(permissionState: PushPermissionState): void {
  if (hasRegisteredPushReachability()) return;
  markPushReachabilityRegistered();
  track(
    'push_reachability_registered',
    buildPushReachabilityAnalyticsProps({ permissionState }),
  );
}

async function attachPushListeners(slug: string): Promise<void> {
  activeSlug = slug;
  if (listenersAttached || !Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  await PushNotifications.addListener('registration', async (token) => {
    const targetSlug = activeSlug;
    if (!targetSlug || !getCustomerToken(targetSlug)) return;
    const permissionState =
      readStoredPermissionState() ??
      (Capacitor.getPlatform() === 'ios' ? 'provisional' : 'default_on');
    await uploadTokenToBackend(targetSlug, token.value, permissionState);
    trackReachabilityRegistered(permissionState);
  });

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('Consumer push registration error', err);
  });

  await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
    const data = (notification.data ?? {}) as Record<string, unknown>;
    const targetSlug = activeSlug;
    if (targetSlug) {
      await ackPushDeliveryIfPresent(targetSlug, data);
    }
    const payload = parseConsumerPushPayload(data);
    if (!shouldShowConsumerForegroundPush(payload)) return;
    showConsumerForegroundPushBanner(payload, {
      title: notification.title,
      body: notification.body,
    });
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
    const data = (action.notification.data ?? {}) as Record<string, unknown>;
    const targetSlug = activeSlug;
    if (targetSlug) {
      await ackPushDeliveryIfPresent(targetSlug, data);
    }
    const payload = parseConsumerPushPayload(data);
    const permission = readStoredPermissionState() ?? 'unknown';
    if (
      shouldMarkProvisionalPushEngaged({
        platform: Capacitor.getPlatform(),
        permission,
      })
    ) {
      markProvisionalPushEngaged();
      notifyProvisionalPushEngaged(activeSlug);
    }
    dispatchConsumerPushEffects(payload);
  });

  listenersAttached = true;
}

async function applyAndroidPushChannelSpecs(specs: AndroidPushChannelSyncSpec[]): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  for (const spec of specs) {
    await PushNotifications.createChannel(spec);
  }
}

/** n99-4.3 — create default Android channels (transactional high, marketing lower). */
async function ensureAndroidChannels(
  prefs: ConsumerNotificationPreferences = normalizeConsumerNotificationPreferences({}),
): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  await applyAndroidPushChannelSpecs(buildAndroidPushChannelSyncSpecs(prefs));
}

/** n99-4.3 — sync Android channels after adopt-4.8 preference center changes. */
export async function syncConsumerAndroidPushChannels(
  prefs: ConsumerNotificationPreferences,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
  await applyAndroidPushChannelSpecs(buildAndroidPushChannelSyncSpecs(prefs));
}

async function readCapacitorPermissionState(): Promise<PushPermissionState> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  const stored = readStoredPermissionState();
  if (stored === 'provisional' && perm.receive === 'granted') return 'provisional';
  if (isAndroidDefaultOnReachable({
    platform: Capacitor.getPlatform(),
    permissionReceive: perm.receive,
  })) {
    return mapCapacitorPermission(perm.receive, { defaultOn: true });
  }
  return mapCapacitorPermission(perm.receive);
}

export async function getConsumerNativePushStatus(
  slug: string,
): Promise<ConsumerNativePushStatus> {
  const platform = Capacitor.getPlatform();
  if (!Capacitor.isNativePlatform() || (platform !== 'android' && platform !== 'ios')) {
    return { registered: false, platform: null, permission: 'unknown' };
  }

  const permission = await readCapacitorPermissionState();

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

async function registerNativePushToken(
  slug: string,
  permissionState: PushPermissionState,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) return;
  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  persistPermissionState(permissionState);
  await ensureAndroidChannels();
  await attachPushListeners(slug);
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.register();

  const cached = getCachedFcmToken();
  if (cached) {
    const ok = await uploadTokenToBackend(slug, cached, permissionState);
    if (ok) trackReachabilityRegistered(permissionState);
    if (!ok) localStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

/** n99-4.1 — provisional reachability on first app open (no sign-in, no OS prompt). */
export async function ensureIosProvisionalReachabilityOnFirstOpen(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || Capacitor.getPlatform() !== 'ios') {
    return;
  }

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (
    !shouldEnsureIosProvisionalReachabilityOnFirstOpen({
      platform: 'ios',
      isNative: true,
      isFcmBuild: true,
      alreadyRegistered: hasRegisteredPushReachability(),
      permissionReceive: perm.receive,
    })
  ) {
    return;
  }

  const state = resolveIosProvisionalPermissionState(perm.receive);
  if (state !== 'provisional') return;

  persistIosProvisionalPermissionState();
  await PushNotifications.register();
  markPushReachabilityRegistered();
  track('push_reachability_registered', buildIosProvisionalReachabilityAnalyticsProps());
}

/** n99-4.2 — pre-13 Android default-on reachability on first open (no POST_NOTIFICATIONS prompt). */
export async function ensureAndroidDefaultOnReachabilityOnFirstOpen(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild()) return;
  if (Capacitor.getPlatform() !== 'android') return;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (
    !shouldEnsureAndroidDefaultOnReachabilityOnFirstOpen({
      platform: 'android',
      isNative: true,
      isFcmBuild: true,
      alreadyRegistered: hasRegisteredPushReachability(),
      permissionReceive: perm.receive,
    })
  ) {
    return;
  }

  persistAndroidDefaultOnPermissionState();
  await ensureAndroidChannels();
  await PushNotifications.register();
  markPushReachabilityRegistered();
  track('push_reachability_registered', buildAndroidDefaultOnReachabilityAnalyticsProps());
}

/** n99-4.1 / n99-4.2 — silent reachability when signed in (upload FCM token). */
export async function registerPushReachability(slug: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) return;
  const platform = Capacitor.getPlatform();

  if (platform === 'ios') {
    persistIosProvisionalPermissionState();
    await registerNativePushToken(slug, 'provisional');
    return;
  }

  if (platform === 'android') {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'granted') {
      await registerNativePushToken(slug, 'default_on');
    }
  }
}

/** n99-4.2 — Android 13+ POST_NOTIFICATIONS after first booking success (not on launch). */
export async function requestAndroidPostBookingNotificationPermission(
  slug: string,
): Promise<EnableConsumerNativePushResult> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return 'error';
  const permission = await readCapacitorPermissionState();
  if (
    !shouldRequestAndroidPostBookingPermission({
      platform: 'android',
      completedBookingCount: getCompletedBookingCount(),
      permission,
    })
  ) {
    return 'error';
  }

  markAndroidPostBookingPermissionRequested();
  const result = await enableConsumerNativePush(slug, {
    permissionState: 'full',
    trackExplicitUpgrade: false,
  });
  if (result === 'ok') {
    track(
      'push_reachability_registered',
      buildPushReachabilityAnalyticsProps({ permissionState: 'full' }),
    );
  }
  return result;
}

export async function syncConsumerNativePushToken(slug: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) return;

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return;

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted' && readStoredPermissionState() !== 'provisional') return;

  await ensureAndroidChannels();
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
      const state = readStoredPermissionState() ?? 'full';
      const ok = await uploadTokenToBackend(slug, cached, state);
      if (!ok) localStorage.removeItem(PUSH_TOKEN_KEY);
    }
  }
}

export type EnableConsumerNativePushResult = 'ok' | 'denied' | 'timeout' | 'error';

export async function enableConsumerNativePush(
  slug: string,
  options?: { permissionState?: PushPermissionState; trackExplicitUpgrade?: boolean },
): Promise<EnableConsumerNativePushResult> {
  if (!Capacitor.isNativePlatform() || !isFcmBuild() || !getCustomerToken(slug)) {
    return 'error';
  }

  const platform = Capacitor.getPlatform();
  if (platform !== 'android' && platform !== 'ios') return 'error';

  const { PushNotifications } = await import('@capacitor/push-notifications');
  const previousState = readStoredPermissionState();

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== 'granted') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return 'denied';

  const permissionState = options?.permissionState ?? 'full';
  markPushOptIn(true);
  persistPermissionState(permissionState);
  await ensureAndroidChannels();
  await attachPushListeners(slug);
  await PushNotifications.register();

  if (
    options?.trackExplicitUpgrade !== false &&
    (previousState === 'provisional' || previousState === 'default_on')
  ) {
    track(
      'push_permission_upgraded',
      buildPushReachabilityAnalyticsProps({ permissionState: 'full', pushOptIn: true }),
    );
  }

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

/** n99-4.4 — value-first priming accept triggers the OS permission dialog. */
export async function acceptValueFirstPushPriming(
  slug: string,
): Promise<EnableConsumerNativePushResult> {
  if (Capacitor.getPlatform() === 'android') {
    markAndroidPostBookingPermissionRequested();
  }
  return enableConsumerNativePush(slug, { permissionState: 'full' });
}

/** n99-4.5 — upgrade provisional → full after engagement ("keep these on"). */
export async function acceptProvisionalToFullUpgrade(
  slug: string,
): Promise<EnableConsumerNativePushResult> {
  const result = await enableConsumerNativePush(slug, { permissionState: 'full' });
  if (result === 'ok') {
    track(
      'push_permission_upgraded',
      buildProvisionalToFullUpgradeAcceptedAnalyticsProps(true),
    );
  }
  return result;
}

/** @deprecated Use acceptProvisionalToFullUpgrade */
export async function upgradeProvisionalToFullPush(
  slug: string,
): Promise<EnableConsumerNativePushResult> {
  return acceptProvisionalToFullUpgrade(slug);
}

export function readConsumerPushPermissionState(): PushPermissionState {
  return readStoredPermissionState() ?? 'unknown';
}
