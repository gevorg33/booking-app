import type { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface RegisterCustomerPushLogicDeps {
  consumerPushTokenService: Pick<ConsumerPushTokenService, 'registerToken'>;
  publicCustomerAuthService: Pick<
    PublicCustomerAuthService,
    'linkAnalyticsAnonByCustomerId'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
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
  const raw = params.platform ?? params.nativePlatform;
  if (raw === 'ios' || raw === 'android') return raw;
  return undefined;
}

export async function handleRegisterCustomerPushLogic(
  deps: RegisterCustomerPushLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'register_customer_push',
      'Sign in to register push notifications on this device.',
      { clarify: true },
    );
  }

  const token = typeof params.token === 'string' ? params.token.trim() : '';
  const platform = resolveNativePlatform(params);
  if (!token || !platform) {
    return failure(
      'register_customer_push',
      'Missing device push token or platform.',
      {
        clarify: true,
        missing: [...(token ? [] : ['token']), ...(platform ? [] : ['platform'])],
      },
    );
  }

  const analyticsAnonId =
    typeof params.analyticsAnonId === 'string'
      ? params.analyticsAnonId
      : undefined;
  const permissionState =
    params.permissionState === 'full' ||
    params.permissionState === 'provisional' ||
    params.permissionState === 'default_on'
      ? params.permissionState
      : undefined;

  try {
    const result = await deps.consumerPushTokenService.registerToken(
      customerId,
      businessId,
      { token, platform, analyticsAnonId, permissionState },
    );
    if (analyticsAnonId) {
      await deps.publicCustomerAuthService.linkAnalyticsAnonByCustomerId(
        businessId,
        customerId,
        analyticsAnonId,
      );
    }
    return success(
      'register_customer_push',
      `Push notifications are now on for your ${platform === 'ios' ? 'iPhone' : 'Android'} device.`,
      { registered: true, platform, refreshed: result.refreshed },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Could not register push notifications.';
    return failure('register_customer_push', message, { platform });
  }
}
