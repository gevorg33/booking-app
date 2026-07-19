import { Repository, Between, In, Not } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { NotificationLog } from '../notifications/entities/notification-log.entity.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import type { PushService } from '../provider-mobile/push.service.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { ProviderPushHistoryService } from '../provider-mobile/provider-push-history.service.js';
import {
  aggregateEodSummaries,
  buildEodPushPayload,
} from '../provider-mobile/provider-end-of-day-summary.util.js';
import { mergeBusinessNotificationSettings } from '../notifications/notification.types.js';
import { mergeCustomerReminderChoiceSettings } from '../notifications/appointment-reminder-settings.util.js';
import type { CommandResult } from './command-completion.types.js';
import { handleConfigureNotificationSettingsLogic } from './ai-notification-settings.logic.js';
import { handleConfigureWhatsappIntegrationLogic } from './ai-whatsapp-integration.logic.js';
import {
  buildNewBookingPushActionsGuide,
  buildOfflineQueueStatusSummary,
  buildProviderExplainAppUpdateGateSummary,
  buildProviderExplainOfflineModeSummary,
  buildRetryOfflineActionGuidance,
  decomposePushNotificationsCompoundPrompt,
  explainLastPushSummary,
  extractBookingIdFromPushPrompt,
  extractBusinessEmailOnCustomerChangeToggleFromPrompt,
  extractNotificationToggleFromPrompt,
  resolveNotificationEnabledFromPrompt,
  resolveSmsRemindersWhenEnabling,
  extractPushRecipientNamesFromPrompt,
  extractReminderHoursFromPrompt,
  resolveCommandPromptText,
  parseProviderLastPushPayload,
  summarizeProviderPushNotificationCenter,
  type PushNotificationsCompoundStep,
  type ProviderLastPushPayload,
} from './ai-push-notifications.util.js';

export interface PushNotificationsLogicDeps {
  notificationsService: NotificationsService;
  whatsappIntegrationService: WhatsAppIntegrationService;
  pushService: PushService;
  providerMobileService: ProviderMobileService;
  pushHistoryService: ProviderPushHistoryService;
  bookingRepo: Repository<Booking>;
  businessRepo: Repository<Business>;
  customerRepo: Repository<Customer>;
  employeeRepo: Repository<Employee>;
  notificationLogRepo: Repository<NotificationLog>;
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
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function resolveLastPush(
  params: Record<string, any>,
): ProviderLastPushPayload | null {
  return (
    parseProviderLastPushPayload(params.lastPush) ??
    parseProviderLastPushPayload(params.lastPushPayload) ??
    null
  );
}

function resolveOfflineState(params: Record<string, any>): {
  online: boolean;
  queuedCount: number;
} {
  const online = params.online !== false && params.isOnline !== false;
  const queuedCount = Number(
    params.offlineQueueCount ?? params.queuedCount ?? 0,
  );
  return {
    online,
    queuedCount:
      Number.isFinite(queuedCount) && queuedCount > 0
        ? Math.round(queuedCount)
        : 0,
  };
}

async function resolveRecipientUserIds(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  names: string[],
): Promise<string[]> {
  const employees = await deps.employeeRepo.find({
    where: { businessId, isActive: true },
  });
  const userIds: string[] = [];
  for (const name of names) {
    const needle = name.toLowerCase();
    const match =
      employees.find((e) => e.name.toLowerCase() === needle) ??
      employees.find((e) => e.name.toLowerCase().includes(needle));
    if (match?.userId) userIds.push(match.userId);
  }
  return [...new Set(userIds)];
}

export async function handleExplainLastPushLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  const payload = resolveLastPush(params);
  if (!payload) {
    return failure(
      'explain_last_push',
      'No recent push payload was provided. Open the notification again or paste the booking ID.',
      {
        clarify: true,
        missing: ['lastPush'],
      },
    );
  }
  return success('explain_last_push', explainLastPushSummary(payload), {
    payload,
    explained: true,
  });
}

export async function handleOpenBookingFromPushLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const payload = resolveLastPush(params);
  const bookingId =
    (params.bookingId as string | undefined) ??
    payload?.bookingId ??
    extractBookingIdFromPushPrompt(resolveCommandPromptText(prompt, params));

  if (!bookingId) {
    return failure(
      'open_booking_from_push',
      'No booking was linked to that push. Try opening Today and selecting the appointment.',
      {
        clarify: true,
        missing: ['bookingId'],
      },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { customer: true, service: true },
  });
  if (!booking) {
    return failure(
      'open_booking_from_push',
      'Booking not found for that push link.',
    );
  }

  const url = payload?.url ?? `/provider/today?bookingId=${bookingId}`;
  return success(
    'open_booking_from_push',
    `Open ${booking.customer?.name ?? 'appointment'} — ${booking.service?.name ?? 'service'} at ${booking.startTime.toISOString().slice(0, 16).replace('T', ' ')}.`,
    {
      bookingId,
      url,
      deepLink: url,
      booking: {
        id: booking.id,
        customerName: booking.customer?.name ?? null,
        serviceName: booking.service?.name ?? null,
        startTime: booking.startTime,
      },
    },
  );
}

export async function handleOfflineQueueStatusLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  const state = resolveOfflineState(params);
  return success(
    'offline_queue_status',
    buildOfflineQueueStatusSummary(state),
    {
      ...state,
      providerOffline: true,
    },
  );
}

export async function handleRetryOfflineActionLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  const state = resolveOfflineState(params);
  const guidance = buildRetryOfflineActionGuidance(state);
  return {
    success: guidance.canRetry || state.queuedCount === 0,
    action: 'retry_offline_action',
    summary: guidance.summary,
    details: {
      ...state,
      canRetry: guidance.canRetry,
      steps: guidance.steps,
      providerOffline: true,
      replayRequested: state.queuedCount > 0,
    },
  };
}

export async function handleProviderExplainOfflineModeLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  const state = resolveOfflineState(params);
  return success(
    'explain_offline_mode',
    buildProviderExplainOfflineModeSummary(state),
    {
      ...state,
      providerOffline: true,
    },
  );
}

export async function handleProviderExplainAppUpdateGateLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  return success(
    'explain_app_update_gate',
    buildProviderExplainAppUpdateGateSummary({
      currentVersion:
        typeof params.currentVersion === 'string'
          ? params.currentVersion
          : undefined,
      blocked: params.blocked === true,
    }),
    { providerAppGate: true },
  );
}

export async function handleDismissPushLogic(
  _deps: PushNotificationsLogicDeps,
  params: Record<string, any>,
): Promise<CommandResult> {
  const payload = resolveLastPush(params);
  return success(
    'dismiss_push',
    'Push dismissed — you can reopen the booking from Today if needed.',
    {
      dismissed: true,
      pushType: payload?.pushType ?? null,
      bookingId: payload?.bookingId ?? null,
    },
  );
}

export async function handleListPushNotificationsLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const view = await deps.pushHistoryService.listNotificationCenter(
    businessId,
    userId,
  );
  return success(
    'list_push_notifications',
    summarizeProviderPushNotificationCenter(view),
    { ...view },
  );
}

export async function handleMarkAllNotificationsReadLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const { updated } = await deps.pushHistoryService.markAllNotificationsRead(
    businessId,
    userId,
  );
  return success(
    'mark_all_notifications_read',
    updated
      ? `Marked ${updated} notification${updated === 1 ? '' : 's'} as read.`
      : 'No unread notifications to mark as read.',
    { updated },
  );
}

export async function handleMarkNotificationReadLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  let notificationId =
    typeof params.notificationId === 'string' && params.notificationId.trim()
      ? params.notificationId.trim()
      : undefined;

  if (!notificationId) {
    const view = await deps.pushHistoryService.listNotificationCenter(
      businessId,
      userId,
    );
    const target = view.items.find((item) => !item.isRead) ?? view.items[0];
    if (!target) {
      return failure(
        'mark_notification_read',
        'No notifications to mark as read.',
        { clarify: true },
      );
    }
    notificationId = target.id;
  }

  try {
    const notification = await deps.pushHistoryService.markNotificationRead(
      businessId,
      userId,
      notificationId,
    );
    return success(
      'mark_notification_read',
      `Marked "${notification.title}" as read.`,
      { notificationId: notification.id, title: notification.title },
    );
  } catch {
    return failure(
      'mark_notification_read',
      'Notification not found.',
      { clarify: true },
    );
  }
}

export async function handleMarkBookingNotificationsReadLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = resolveCommandPromptText(prompt, params);
  const payload = resolveLastPush(params);
  const bookingId =
    (params.bookingId as string | undefined) ??
    payload?.bookingId ??
    extractBookingIdFromPushPrompt(promptText);

  if (!bookingId) {
    return failure(
      'mark_booking_notifications_read',
      "Specify which booking's notifications to mark as read.",
      { clarify: true, missing: ['bookingId'] },
    );
  }

  await deps.pushHistoryService.markLatestBookingNotificationRead(
    businessId,
    userId,
    bookingId,
  );
  return success(
    'mark_booking_notifications_read',
    'Marked notifications for that booking as read.',
    { bookingId },
  );
}

export async function handleEndOfDaySummaryLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const employeeId =
    (params.sessionEmployeeId as string | undefined) ??
    (params.employeeId as string | undefined);
  if (!employeeId) {
    return failure(
      'end_of_day_summary',
      'Provider scope is required for end-of-day summary.',
      {
        clarify: true,
        missing: ['sessionEmployeeId'],
      },
    );
  }

  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      employeeId,
      startTime: Between(start, end),
      status: Not(In([BookingStatus.CANCELLED])),
    },
  });

  const rows = bookings.map((b) => ({
    businessId: b.businessId,
    employeeId: b.employeeId,
    status: b.status,
    paymentStatus: b.paymentStatus,
  }));
  const summaries = aggregateEodSummaries(rows, new Map([[employeeId, 0]]));
  const summary = summaries[0] ?? {
    businessId,
    employeeId,
    appointmentCount: 0,
    unpaidCount: 0,
    noShowCount: 0,
    gapsTomorrow: 0,
  };
  const pushPayload = buildEodPushPayload(summary);

  return success(
    'end_of_day_summary',
    pushPayload.body || 'No appointments today.',
    {
      summary,
      pushPayload,
      appointmentCount: summary.appointmentCount,
      unpaidCount: summary.unpaidCount,
      noShowCount: summary.noShowCount,
    },
  );
}

export async function handleNewBookingPushActionsLogic(
  _deps: PushNotificationsLogicDeps,
): Promise<CommandResult> {
  const guide = buildNewBookingPushActionsGuide();
  return success('new_booking_push_actions', guide.summary, guide);
}

export async function handleConfigurePushRecipientsLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('configure_push_recipients', 'Business not found.');

  const current = mergeBusinessNotificationSettings(
    business.settings?.notifications,
  );
  const patch: Record<string, unknown> = {};

  const managerToggle = extractNotificationToggleFromPrompt(promptText);
  if (/\bmanager/i.test(promptText) && managerToggle !== null) {
    patch.pushManagerAlertsEnabled = managerToggle;
  }

  const names =
    (params.recipientNames as string[] | undefined) ??
    extractPushRecipientNamesFromPrompt(promptText);
  if (names?.length) {
    const userIds = await resolveRecipientUserIds(deps, businessId, names);
    if (!userIds.length) {
      return failure(
        'configure_push_recipients',
        `Could not find active providers matching: ${names.join(', ')}.`,
      );
    }
    patch.pushAdditionalRecipientUserIds = [
      ...new Set([...current.pushAdditionalRecipientUserIds, ...userIds]),
    ];
  }

  if (!Object.keys(patch).length) {
    return success(
      'configure_push_recipients',
      `Push recipients: managers ${current.pushManagerAlertsEnabled ? 'enabled' : 'disabled'}, ${current.pushAdditionalRecipientUserIds.length} extra user(s).`,
      {
        settings: current,
        guidance:
          'Say "disable manager push alerts" or "add push recipients for Maria".',
      },
    );
  }

  const settings = await deps.notificationsService.updateBusinessSettings(
    businessId,
    patch,
  );
  return success(
    'configure_push_recipients',
    `Updated push recipients — managers ${settings.pushManagerAlertsEnabled ? 'on' : 'off'}, ${settings.pushAdditionalRecipientUserIds.length} extra recipient(s).`,
    { settings },
  );
}

export async function handleTestPushLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const userId = params.userId as string | undefined;
  if (!userId) {
    return failure(
      'test_push',
      'Sign in to send a test push to your devices.',
      { clarify: true, missing: ['userId'] },
    );
  }
  if (!deps.pushService.isConfigured) {
    return failure(
      'test_push',
      'Push is not configured — set VAPID keys or Firebase for native push.',
    );
  }

  const sent = await deps.pushService.sendToUser(userId, businessId, {
    title: 'Test push',
    body: 'Provider push notifications are working.',
    url: '/provider/today',
    pushType: 'booking_updated',
  });

  if (!sent) {
    return failure(
      'test_push',
      'No push subscriptions found for your account. Enable notifications in the provider app first.',
    );
  }

  return success('test_push', `Test push sent to ${sent} device(s).`, {
    sent,
    devices: sent,
  });
}

export async function handleNotificationHistoryLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const limit = Math.min(Math.max(Number(params.limit ?? 20), 1), 100);
  const logs = await deps.notificationLogRepo.find({
    where: { businessId },
    order: { sentAt: 'DESC' },
    take: limit,
  });

  const summary =
    logs.length === 0
      ? 'No notification logs yet for this business.'
      : `Last ${logs.length} notifications: ${logs
          .slice(0, 3)
          .map((l) => `${l.kind} via ${l.channel} (${l.status})`)
          .join('; ')}${logs.length > 3 ? '…' : ''}.`;

  return success('notification_history', summary, {
    count: logs.length,
    logs: logs.map((l) => ({
      id: l.id,
      bookingId: l.bookingId,
      channel: l.channel,
      kind: l.kind,
      status: l.status,
      recipient: l.recipient,
      sentAt: l.sentAt,
      error: l.error,
    })),
  });
}

export async function handleToggleBusinessEmailOnCustomerChangeLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const toggle =
    params.enabled !== undefined
      ? Boolean(params.enabled)
      : extractBusinessEmailOnCustomerChangeToggleFromPrompt(promptText);

  if (toggle === null) {
    const settings =
      await deps.notificationsService.getBusinessSettings(businessId);
    return success(
      'toggle_business_email_on_customer_change',
      `Business email on customer cancel/reschedule is ${settings.notifyBusinessOnCustomerBookingChange ? 'enabled' : 'disabled'}.`,
      { settings },
    );
  }

  const settings = await deps.notificationsService.updateBusinessSettings(
    businessId,
    {
      notifyBusinessOnCustomerBookingChange: toggle,
    },
  );
  // e2e-bug.159 — clarify recipient (business/owner) + future events, not a
  // one-off customer-facing message about an already-cancelled booking.
  return success(
    'toggle_business_email_on_customer_change',
    toggle
      ? 'Business email alerts are now enabled: you will be emailed when a customer cancels or reschedules online (ongoing preference for future events — this does not message the customer).'
      : 'Business email on customer booking changes is now disabled.',
    { settings, notifyBusinessOnCustomerBookingChange: toggle },
  );
}

export async function handleEnableNotificationsLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'enable_notifications',
      'Sign in to manage your notification preferences.',
      {
        clarify: true,
        missing: ['sessionCustomerId'],
      },
    );
  }

  const customer = await deps.customerRepo.findOne({
    where: { id: customerId, businessId },
  });
  if (!customer)
    return failure('enable_notifications', 'Customer profile not found.');

  const promptText = resolveCommandPromptText(prompt, params);
  const enabled = resolveNotificationEnabledFromPrompt(promptText);

  const metadata = { ...(customer.metadata ?? {}) };
  const existingNotifications = metadata.notifications as
    | Record<string, unknown>
    | undefined;
  const notifications = {
    ...(existingNotifications ?? {}),
    emailReminders: enabled,
    smsReminders: resolveSmsRemindersWhenEnabling(
      enabled,
      existingNotifications,
    ),
    whatsappReminders: enabled,
  };
  metadata.notifications = notifications;
  customer.metadata = metadata;
  await deps.customerRepo.save(customer);

  return success(
    'enable_notifications',
    enabled
      ? 'Appointment notifications enabled for email and WhatsApp reminders.'
      : 'Appointment notifications disabled — you will not receive reminder messages.',
    { preferences: notifications, customerId },
  );
}

export async function handleAppointmentReminderPreferencesLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'appointment_reminder_preferences',
      'Sign in to view reminder preferences.',
      {
        clarify: true,
        missing: ['sessionCustomerId'],
      },
    );
  }

  const [business, customer] = await Promise.all([
    deps.businessRepo.findOne({ where: { id: businessId } }),
    deps.customerRepo.findOne({ where: { id: customerId, businessId } }),
  ]);
  if (!business || !customer) {
    return failure(
      'appointment_reminder_preferences',
      'Could not load reminder settings.',
    );
  }

  const businessSettings = mergeBusinessNotificationSettings(
    business.settings?.notifications,
  );
  const reminderChoice = mergeCustomerReminderChoiceSettings(businessSettings);
  const prefs =
    (customer.metadata?.notifications as Record<string, unknown>) ?? {};

  const promptText = prompt ?? (params._prompt as string) ?? '';
  const hours =
    params.reminderHoursBefore !== undefined
      ? Number(params.reminderHoursBefore)
      : extractReminderHoursFromPrompt(promptText);

  let selectedHours: number | null =
    reminderChoice.defaultCustomerReminderHours;
  if (
    customer.metadata &&
    'reminderHoursBefore' in (customer.metadata as object)
  ) {
    const stored = customer.metadata.reminderHoursBefore;
    if (stored === null) selectedHours = null;
    else if (typeof stored === 'number') selectedHours = stored;
  }

  if (
    hours !== null &&
    Number.isFinite(hours) &&
    reminderChoice.allowCustomerReminderChoice
  ) {
    if (
      !reminderChoice.customerReminderOptionsHours.includes(Math.round(hours))
    ) {
      return failure(
        'appointment_reminder_preferences',
        `Choose one of: ${reminderChoice.customerReminderOptionsHours.join(', ')} hours before.`,
        { options: reminderChoice.customerReminderOptionsHours },
      );
    }
    customer.metadata = {
      ...(customer.metadata ?? {}),
      reminderHoursBefore: Math.round(hours),
    };
    await deps.customerRepo.save(customer);
    selectedHours = Math.round(hours);
  }

  const optionsText = reminderChoice.allowCustomerReminderChoice
    ? reminderChoice.customerReminderOptionsHours
        .map((h) => `${h}h before`)
        .join(', ')
    : 'Business default reminders only';

  return success(
    'appointment_reminder_preferences',
    reminderChoice.allowCustomerReminderChoice
      ? `Reminder options: ${optionsText}. Your selection: ${selectedHours === null ? 'no reminders' : `${selectedHours}h before`}.`
      : `This business uses fixed reminders. Channels — email: ${prefs.emailReminders !== false}, WhatsApp: ${prefs.whatsappReminders !== false}.`,
    {
      allowCustomerReminderChoice: reminderChoice.allowCustomerReminderChoice,
      optionsHours: reminderChoice.customerReminderOptionsHours,
      defaultHours: reminderChoice.defaultCustomerReminderHours,
      selectedHours,
      preferences: prefs,
    },
  );
}

export function mergePushNotificationsCompoundContext(
  context: Record<string, unknown>,
  step: PushNotificationsCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };

  if (step.action === 'explain_last_push' && details.payload) {
    next.lastPush = details.payload;
  }
  if (step.action === 'open_booking_from_push' && details.bookingId) {
    next.bookingId = details.bookingId;
  }
  if (step.action === 'offline_queue_status') {
    next.offlineQueueCount = details.queuedCount;
    next.online = details.online;
  }
  if (step.action === 'configure_push_recipients' && details.settings) {
    next.pushRecipientsConfigured = true;
  }
  return next;
}

export async function handlePushNotificationsCompoundLogic(
  deps: PushNotificationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const steps: PushNotificationsCompoundStep[] =
    (params.compoundSteps as PushNotificationsCompoundStep[] | undefined) ??
    decomposePushNotificationsCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple push/notification commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'explain_last_push':
        result = await handleExplainLastPushLogic(deps, stepParams);
        break;
      case 'open_booking_from_push':
        result = await handleOpenBookingFromPushLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'offline_queue_status':
        result = await handleOfflineQueueStatusLogic(deps, stepParams);
        break;
      case 'retry_offline_action':
        result = await handleRetryOfflineActionLogic(deps, stepParams);
        break;
      case 'dismiss_push':
        result = await handleDismissPushLogic(deps, stepParams);
        break;
      case 'end_of_day_summary':
        result = await handleEndOfDaySummaryLogic(deps, businessId, stepParams);
        break;
      case 'new_booking_push_actions':
        result = await handleNewBookingPushActionsLogic(deps);
        break;
      case 'configure_push_recipients':
        result = await handleConfigurePushRecipientsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_notification_settings':
        result = await handleConfigureNotificationSettingsLogic(
          { notificationsService: deps.notificationsService },
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_whatsapp_integration':
        result = await handleConfigureWhatsappIntegrationLogic(
          { whatsappIntegrationService: deps.whatsappIntegrationService },
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'test_push':
        result = await handleTestPushLogic(deps, businessId, stepParams);
        break;
      case 'notification_history':
        result = await handleNotificationHistoryLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'toggle_business_email_on_customer_change':
        result = await handleToggleBusinessEmailOnCustomerChangeLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'enable_notifications':
        result = await handleEnableNotificationsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'appointment_reminder_preferences':
        result = await handleAppointmentReminderPreferencesLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported push/notification compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
        },
      };
    }
    compoundContext = mergePushNotificationsCompoundContext(
      compoundContext,
      step,
      result,
    );
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} push/notification step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      pushNotificationsCompound: true,
      finalContext: compoundContext,
    },
  };
}
