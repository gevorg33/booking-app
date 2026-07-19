import type { PushService } from '../provider-mobile/push.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ProviderPushSetupLogicDeps {
  pushService: PushService;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveNativePlatform(
  params: Record<string, unknown>,
): 'ios' | 'android' | undefined {
  const raw = params.nativePlatform ?? params.platform;
  if (raw === 'ios' || raw === 'android') return raw;
  return undefined;
}

export async function handleExplainPushSetupLogic(
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const platform = resolveNativePlatform(params);
  const platformHint =
    platform === 'ios'
      ? 'On iOS, allow notifications when prompted, then confirm the toggle shows enabled.'
      : platform === 'android'
        ? 'On Android, allow notifications and ensure booking alerts are not blocked in system settings.'
        : 'On a native iOS or Android build, allow notifications when prompted.';

  return success(
    'explain_push_setup',
    `The provider app uses Firebase Cloud Messaging (FCM) for native booking alerts on your phone. Open Profile → Enable push to opt in. ${platformHint} You will receive alerts for new bookings, updates, and end-of-day summaries when push is enabled for your account.`,
    {
      navigate: { path: '/tabs/profile', query: {} },
      topics: ['new_booking', 'booking_updated', 'end_of_day'],
      platform: platform ?? null,
    },
  );
}

export async function handleEnablePushNotificationsLogic(
  deps: ProviderPushSetupLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  if (!userId?.trim()) {
    return failure(
      'enable_push_notifications',
      'Sign in to the provider app to enable push notifications.',
      { clarify: true },
    );
  }

  const platform = resolveNativePlatform(params);
  const status = await deps.pushService.getNativePushStatus(
    userId,
    businessId,
    platform,
  );

  if (status.registered) {
    return success(
      'enable_push_notifications',
      'Push notifications are already enabled for this provider account on this device.',
      {
        registered: true,
        platform: status.platform,
        navigate: { path: '/tabs/profile', query: {} },
      },
    );
  }

  return success(
    'enable_push_notifications',
    'Opening Profile to enable booking alerts. Tap Enable push and allow notifications when your phone asks.',
    {
      registered: false,
      platform: status.platform,
      navigate: { path: '/tabs/profile', query: { enablePush: '1' } },
      clientAction: 'enableNativePush',
    },
  );
}

export async function handleExplainPushRegistrationStatusLogic(
  deps: ProviderPushSetupLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  if (!userId?.trim()) {
    return failure(
      'explain_push_registration_status',
      'Sign in to the provider app to check your push notification status.',
      { clarify: true },
    );
  }

  const platform = resolveNativePlatform(params);
  const status = await deps.pushService.getNativePushStatus(
    userId,
    businessId,
    platform,
  );

  return success(
    'explain_push_registration_status',
    status.registered
      ? `Push notifications are on for your ${status.platform ?? 'device'}.`
      : 'Push notifications are not enabled on this device yet.',
    { ...status },
  );
}

export async function dispatchProviderPushSetupIntent(
  deps: ProviderPushSetupLogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
): Promise<CommandResult | null> {
  switch (action) {
    case 'explain_push_setup':
      return handleExplainPushSetupLogic(businessId, params);
    case 'enable_push_notifications':
      return handleEnablePushNotificationsLogic(
        deps,
        businessId,
        userId,
        params,
      );
    case 'explain_push_registration_status':
      return handleExplainPushRegistrationStatusLogic(
        deps,
        businessId,
        userId,
        params,
      );
    default:
      return null;
  }
}
