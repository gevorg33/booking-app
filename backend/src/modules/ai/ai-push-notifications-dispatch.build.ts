import type { CommandResult } from './command-completion.types.js';
import {
  handleAppointmentReminderPreferencesLogic,
  handleDismissPushLogic,
  handleEnableNotificationsLogic,
  handleEndOfDaySummaryLogic,
  handleExplainLastPushLogic,
  handleNewBookingPushActionsLogic,
  handleNotificationHistoryLogic,
  handleOfflineQueueStatusLogic,
  handleOpenBookingFromPushLogic,
  handleRetryOfflineActionLogic,
  handleTestPushLogic,
  handleToggleBusinessEmailOnCustomerChangeLogic,
  type PushNotificationsLogicDeps,
} from './ai-push-notifications.logic.js';

export type PushNotificationsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId?: string;
  employeeId?: string;
  sessionLastPush?: unknown;
  sessionOfflineQueueCount?: unknown;
  sessionOnline?: unknown;
  sessionScopedEmployeeId?: string;
  sessionCustomerId?: string;
};

export type PushNotificationsLogicDispatchHandler = (
  deps: PushNotificationsLogicDeps,
  ctx: PushNotificationsDispatchContext,
) => Promise<CommandResult>;

export function buildPushNotificationsLogicDispatchMap(): ReadonlyMap<
  string,
  PushNotificationsLogicDispatchHandler
> {
  const map = new Map<string, PushNotificationsLogicDispatchHandler>();

  map.set('explain_last_push', (deps, ctx) =>
    handleExplainLastPushLogic(deps, {
      ...ctx.params,
      lastPush: ctx.params.lastPush ?? ctx.sessionLastPush,
    }),
  );
  map.set('open_booking_from_push', (deps, ctx) =>
    handleOpenBookingFromPushLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        lastPush: ctx.params.lastPush ?? ctx.sessionLastPush,
      },
      ctx.prompt,
    ),
  );
  map.set('offline_queue_status', (deps, ctx) =>
    handleOfflineQueueStatusLogic(deps, {
      ...ctx.params,
      offlineQueueCount:
        ctx.params.offlineQueueCount ?? ctx.sessionOfflineQueueCount,
      online: ctx.params.online ?? ctx.sessionOnline,
    }),
  );
  map.set('retry_offline_action', (deps, ctx) =>
    handleRetryOfflineActionLogic(deps, {
      ...ctx.params,
      offlineQueueCount:
        ctx.params.offlineQueueCount ?? ctx.sessionOfflineQueueCount,
      online: ctx.params.online ?? ctx.sessionOnline,
    }),
  );
  map.set('dismiss_push', (deps, ctx) =>
    handleDismissPushLogic(deps, {
      ...ctx.params,
      lastPush: ctx.params.lastPush ?? ctx.sessionLastPush,
    }),
  );
  map.set('end_of_day_summary', (deps, ctx) =>
    handleEndOfDaySummaryLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionEmployeeId:
        (ctx.params.sessionEmployeeId as string | undefined) ??
        ctx.sessionScopedEmployeeId ??
        ctx.employeeId,
    }),
  );
  map.set('new_booking_push_actions', (deps) =>
    handleNewBookingPushActionsLogic(deps),
  );
  map.set('test_push', (deps, ctx) =>
    handleTestPushLogic(deps, ctx.businessId, {
      ...ctx.params,
      userId: ctx.userId,
    }),
  );
  map.set('notification_history', (deps, ctx) =>
    handleNotificationHistoryLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('toggle_business_email_on_customer_change', (deps, ctx) =>
    handleToggleBusinessEmailOnCustomerChangeLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('enable_notifications', (deps, ctx) =>
    handleEnableNotificationsLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionCustomerId: ctx.sessionCustomerId,
      },
      ctx.prompt,
    ),
  );
  map.set('appointment_reminder_preferences', (deps, ctx) =>
    handleAppointmentReminderPreferencesLogic(
      deps,
      ctx.businessId,
      {
        ...ctx.params,
        sessionCustomerId: ctx.sessionCustomerId,
      },
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiPushNotificationsService (ai-cmd-ext-0.5). */
export const PUSH_NOTIFICATIONS_LOGIC_DISPATCH_MAP =
  buildPushNotificationsLogicDispatchMap();
