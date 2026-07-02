import type { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assemblePushPermissionSummary,
  buildExplainPushPermissionNavigate,
  parseExplainPushPermissionFromPrompt,
  resolvePushPermissionExplainContext,
  shouldOpenConsumerNotificationSettings,
} from './ai-explain-push-permission.util.js';
import {
  DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
  getCustomerNotificationPreferences,
} from '../notifications/notification.types.js';

export interface ExplainPushPermissionLogicDeps {
  consumerPushTokenService: ConsumerPushTokenService;
  publicCustomerAuthService: PublicCustomerAuthService;
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

export async function handleExplainPushPermissionLogic(
  deps: ExplainPushPermissionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainPushPermissionFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_push_permission',
      'Ask about push permission on your phone (e.g. "Why didn\'t I get a notification?" or "Open notification settings").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  let pushRegistered: boolean | null = null;
  if (customerId) {
    const platform = resolveNativePlatform(params);
    const status = await deps.consumerPushTokenService.getNativePushStatus(
      customerId,
      businessId,
      platform,
    );
    pushRegistered = status.registered;
  }

  let pushReminders: boolean | null =
    typeof params.pushReminders === 'boolean' ? params.pushReminders : null;
  if (customerId && pushReminders == null) {
    try {
      const customer = await deps.publicCustomerAuthService.getCustomerById(
        businessId,
        customerId,
      );
      pushReminders = getCustomerNotificationPreferences(
        customer.metadata,
      ).pushReminders;
    } catch {
      pushReminders = DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES.pushReminders;
    }
  }

  const ctx = resolvePushPermissionExplainContext(
    { ...params, pushReminders },
    pushRegistered,
  );
  const summary = assemblePushPermissionSummary(parsed.aspect, ctx);
  const navigate = buildExplainPushPermissionNavigate(parsed.aspect);
  const openSettings = shouldOpenConsumerNotificationSettings(parsed.aspect);

  return success('explain_push_permission', summary, {
    aspect: parsed.aspect,
    navigate,
    permissionState: ctx.permissionState,
    platform: ctx.platform,
    pushRegistered: ctx.pushRegistered,
    pushRemindersEnabled: ctx.pushRemindersEnabled,
    ...(openSettings
      ? { clientAction: 'openConsumerNotificationSettings' }
      : {}),
  });
}
