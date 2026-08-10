import type { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ExplainPushRegistrationStatusLogicDeps {
  consumerPushTokenService: Pick<
    ConsumerPushTokenService,
    'getNativePushStatus'
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

export async function handleExplainPushRegistrationStatusLogic(
  deps: ExplainPushRegistrationStatusLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'explain_push_registration_status',
      'Sign in to check your push notification status.',
      { clarify: true },
    );
  }

  const platform = resolveNativePlatform(params);
  const status = await deps.consumerPushTokenService.getNativePushStatus(
    customerId,
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
