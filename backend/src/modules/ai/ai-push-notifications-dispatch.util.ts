import type { CommandResult } from './command-completion.types.js';
import {
  PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP,
  type PushNotificationsDispatchContext,
  type PushNotificationsLogicDispatchHandler,
} from './ai-push-notifications-dispatch.build.js';
import type { PushNotificationsLogicDeps } from './ai-push-notifications.logic.js';

export function getPushNotificationsLogicDispatchHandler(
  action: string,
): PushNotificationsLogicDispatchHandler | undefined {
  return PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchPushNotificationsLogicIntent(
  deps: PushNotificationsLogicDeps,
  ctx: PushNotificationsDispatchContext,
): Promise<CommandResult | null> {
  const handler = PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function pushNotificationsDispatchMapHas(action: string): boolean {
  return PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP.has(action);
}
