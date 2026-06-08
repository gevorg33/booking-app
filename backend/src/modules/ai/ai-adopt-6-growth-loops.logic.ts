import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getCustomerNotificationPreferences } from '../notifications/notification.types.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildReferralShareUrl,
  deriveReferralCodeFromCustomerId,
} from './ai-adopt-6-growth-loops.fixtures.js';
import { buildConsumerBookServicePushUrl } from '../../common/utils/consumer-booking-push-link.util.js';
import {
  buildConsumerRebookAccountPath,
  buildConsumerRebookPushUrl,
} from '../../common/utils/consumer-rebook.util.js';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import {
  handleAppointmentReminderPreferencesLogic,
  type PushNotificationsLogicDeps,
} from './ai-push-notifications.logic.js';

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

export interface Adopt6GrowthLogicDeps {
  configService: ConfigService;
  notificationsService: PushNotificationsLogicDeps['notificationsService'];
  customerRepo: Repository<Customer>;
  businessRepo: Repository<Business>;
  bookingRepo: Repository<Booking>;
}

function resolveSessionCustomerId(params: Record<string, unknown>): string | undefined {
  return (params.sessionCustomerId as string | undefined)?.trim() || undefined;
}

export async function handleExplainMyNotificationsLogic(
  deps: Adopt6GrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('explain_my_notifications', 'Sign in to see your notification settings.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }
  const customer = await deps.customerRepo.findOne({ where: { id: customerId, businessId } });
  if (!customer) return failure('explain_my_notifications', 'Customer profile not found.');

  const prefs = getCustomerNotificationPreferences(customer.metadata);
  const lines = [
    `Email reminders: ${prefs.emailReminders ? 'on' : 'off'}`,
    `SMS reminders: ${prefs.smsReminders ? 'on' : 'off'}`,
    `WhatsApp reminders: ${prefs.whatsappReminders ? 'on' : 'off'}`,
    `Push reminders: ${prefs.pushReminders ? 'on' : 'off'}`,
    `Offers & rebook tips: ${prefs.pushOffers ? 'on' : 'off'}`,
  ];
  return success(
    'explain_my_notifications',
    `You receive appointment reminders based on your preferences — ${lines.join('; ')}.`,
    { preferences: prefs, customerId },
  );
}

export async function handleManageNotificationPreferencesLogic(
  deps: Adopt6GrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const result = await handleAppointmentReminderPreferencesLogic(
    {
      notificationsService: deps.notificationsService,
      customerRepo: deps.customerRepo,
      businessRepo: deps.businessRepo,
      bookingRepo: deps.bookingRepo,
    } as PushNotificationsLogicDeps,
    businessId,
    params,
    prompt,
  );
  if (result.action === 'appointment_reminder_preferences') {
    return { ...result, action: 'manage_notification_preferences' };
  }
  return result;
}

export async function handleReferAFriendLogic(
  deps: Adopt6GrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('refer_a_friend', 'Sign in to get your personal invite link.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business?.slug) return failure('refer_a_friend', 'Salon profile not found.');

  const referralCode = deriveReferralCodeFromCustomerId(customerId);
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const shareUrl = buildReferralShareUrl(frontendUrl, business.slug, referralCode);

  return success(
    'refer_a_friend',
    `Share your invite link — friends who book earn you both loyalty rewards. Code: ${referralCode}.`,
    { referralCode, shareUrl, deepLink: `optischedule://book/${business.slug}?ref=${referralCode}` },
  );
}

export async function handleRebookLastAppointmentLogic(
  deps: Adopt6GrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('rebook_last_appointment', 'Sign in to rebook your last visit.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business?.slug) return failure('rebook_last_appointment', 'Salon profile not found.');

  const lastBooking = await deps.bookingRepo.findOne({
    where: {
      businessId,
      customerId,
      status: BookingStatus.COMPLETED,
    },
    order: { endTime: 'DESC' },
    relations: { service: true, employee: true },
  });
  if (!lastBooking) {
    return failure('rebook_last_appointment', 'No completed visits to rebook yet.');
  }

  const deepLink = buildConsumerRebookPushUrl({
    slug: business.slug,
    serviceId: lastBooking.serviceId,
    bookingId: lastBooking.id,
    startTime: lastBooking.startTime,
    employeeId: lastBooking.employeeId,
  });
  return success(
    'rebook_last_appointment',
    `Rebook ${lastBooking.service?.name ?? 'your last service'} with ${lastBooking.employee?.name ?? 'your provider'}.`,
    {
      bookingId: lastBooking.id,
      serviceId: lastBooking.serviceId,
      employeeId: lastBooking.employeeId,
      startTime: lastBooking.startTime.toISOString(),
      deepLink,
      accountPath: buildConsumerRebookAccountPath({
        slug: business.slug,
        serviceId: lastBooking.serviceId,
        bookingId: lastBooking.id,
        startTime: lastBooking.startTime,
        employeeId: lastBooking.employeeId,
      }),
    },
  );
}

export async function handleFindMySavedSalonsLogic(
  deps: Adopt6GrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('find_my_saved_salons', 'Sign in to see saved salons in the app.', {
      clarify: true,
      missing: ['sessionCustomerId'],
    });
  }
  const customer = await deps.customerRepo.findOne({ where: { id: customerId, businessId } });
  const saved = (customer?.metadata?.savedSalons as string[] | undefined) ?? [];
  const currentBusiness = await deps.businessRepo.findOne({ where: { id: businessId } });
  const salons = saved.length
    ? saved
    : currentBusiness?.slug
      ? [currentBusiness.slug]
      : [];

  return success(
    'find_my_saved_salons',
    salons.length
      ? `You have ${salons.length} saved salon(s) in the app — open Account to switch quickly.`
      : 'No saved salons yet — book once and pin the salon from Account.',
    { salons, count: salons.length },
  );
}

export function handleExplainPushSetupLogic(): CommandResult {
  return success(
    'explain_push_setup',
    'Enable push in Settings → Notifications, allow alerts in iOS/Android system settings, then return to the app and tap Enable push. You will get new-booking, change, and end-of-day alerts.',
    {
      steps: [
        'Open app Settings → Notifications',
        'Allow alerts in iOS/Android system settings',
        'Tap Enable push in the provider app',
      ],
    },
  );
}

export function handleEnablePushNotificationsLogic(): CommandResult {
  return success(
    'enable_push_notifications',
    'Open Settings → Notifications in the app and tap Enable push. If blocked, allow notifications for OptiSchedule in your phone settings first.',
    {
      mutate: true,
      navigationHint: 'settings/notifications',
      requiresDevicePermission: true,
    },
  );
}
