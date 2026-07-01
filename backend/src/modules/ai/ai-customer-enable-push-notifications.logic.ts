import type { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface CustomerEnablePushNotificationsLogicDeps {
  consumerPushTokenService: ConsumerPushTokenService;
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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function resolveNativePlatform(
  params: Record<string, unknown>,
): 'ios' | 'android' | undefined {
  const raw = params.nativePlatform ?? params.platform;
  if (raw === 'ios' || raw === 'android') return raw;
  return undefined;
}

export async function handleCustomerEnablePushNotificationsLogic(
  deps: CustomerEnablePushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'enable_push_notifications',
      'Sign in to enable push notifications on your phone.',
      { clarify: true },
    );
  }

  const platform = resolveNativePlatform(params);
  const status = await deps.consumerPushTokenService.getNativePushStatus(
    customerId,
    businessId,
    platform,
  );

  if (status.registered) {
    return success(
      'enable_push_notifications',
      'Push notifications are already enabled for your account on this device.',
      {
        registered: true,
        platform: status.platform,
        navigate: {
          path: 'account',
          query: { section: 'notifications' },
        },
      },
    );
  }

  return success(
    'enable_push_notifications',
    'Opening Account notifications to enable push on your phone. Allow notifications when your device asks.',
    {
      registered: false,
      platform: status.platform,
      navigate: {
        path: 'account',
        query: { section: 'notifications', enablePush: '1' },
      },
      clientAction: 'enableConsumerNativePush',
    },
  );
}
