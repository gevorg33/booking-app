import { BookingStatus } from '../booking/entities/booking.entity.js';
import { buildConsumerRebookAccountPath } from '../../common/utils/consumer-rebook.util.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { AiPushNotificationsService } from './ai-push-notifications.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ConsumerAdoptionLogicDeps {
  publicCustomerAuthService: PublicCustomerAuthService;
  publicBookingService: PublicBookingService;
  pushNotifications: AiPushNotificationsService;
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

function resolveSessionCustomerId(params: Record<string, unknown>): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function pickLastCompletedBooking<
  T extends { status: string; startTime: string | Date },
>(bookings: T[]): T | null {
  return (
    bookings
      .filter((b) => String(b.status).toLowerCase() === BookingStatus.COMPLETED)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      )[0] ?? null
  );
}

export async function handleExplainMyNotificationsLogic(
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'explain_my_notifications',
      'Sign in to learn about your notification settings.',
      { clarify: true },
    );
  }

  return success(
    'explain_my_notifications',
    'After you book, you may receive appointment reminders by email, SMS, or WhatsApp when your salon enables them and you opt in. Push notifications appear in the consumer app when enabled on your device. Open Account → Notification preferences to review or change reminder channels.',
    {
      navigate: { path: 'account', query: { section: 'notifications' } },
      channels: ['email', 'sms', 'whatsapp', 'push'],
    },
  );
}

export async function handleManageNotificationPreferencesLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const result = await deps.pushNotifications.handleEnableNotifications(
    businessId,
    params,
    prompt,
  );
  return { ...result, action: 'manage_notification_preferences' };
}

export async function handleReferAFriendLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('refer_a_friend', 'Sign in to get your referral link.', {
      clarify: true,
    });
  }

  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (!slug) {
    return failure('refer_a_friend', 'Business not found.');
  }

  const view = await deps.publicBookingService.getCustomerReferralProgram(
    slug,
    customerId,
  );

  if (!view.enabled) {
    return success(
      'refer_a_friend',
      'Referral rewards are not enabled for this business yet.',
      { enabled: false },
    );
  }

  return success(
    'refer_a_friend',
    `Share your code ${view.referralCode} with friends. When they complete their first visit, you earn ${view.referrerRewardSummary} and they may receive ${view.refereeBonusPoints} bonus points.`,
    {
      referralCode: view.referralCode,
      shareUrl: view.shareUrl,
      enabled: true,
      referrerRewardSummary: view.referrerRewardSummary,
      navigate: { path: 'account', query: { section: 'growth' } },
    },
  );
}

export async function handleRebookLastAppointmentLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'rebook_last_appointment',
      'Sign in to rebook your last visit.',
      { clarify: true },
    );
  }

  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (!slug) return failure('rebook_last_appointment', 'Business not found.');

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const last = pickLastCompletedBooking(bookings);
  if (!last) {
    return failure(
      'rebook_last_appointment',
      'No completed visits found to rebook yet.',
    );
  }

  const path = buildConsumerRebookAccountPath({
    slug,
    serviceId: last.serviceId,
    bookingId: last.id,
    startTime: last.startTime,
    employeeId: last.employeeId,
  });

  return success(
    'rebook_last_appointment',
    `Rebooking ${last.serviceName} with ${last.employeeName} at your last visit time.`,
    {
      bookingId: last.id,
      serviceId: last.serviceId,
      navigate: {
        path: 'checkout',
        query: {
          serviceId: last.serviceId,
          startTime: last.startTime,
          employeeId: last.employeeId,
          rebook: '1',
          rebookBookingId: last.id,
        },
      },
      path,
    },
  );
}

export async function handleShareSalonLinkLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('share_salon_link', 'Sign in to share your salon link.', { clarify: true });
  }
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (!slug) return failure('share_salon_link', 'Business not found.');

  const view = await deps.publicBookingService.getCustomerShareRewards(slug, customerId);
  const rewardHint = view.salonShareEnabled
    ? ` You can earn ${view.salonRewardSummary} when you share.`
    : '';
  return success(
    'share_salon_link',
    `Open Account → Growth and tap Share link to send a deep link to this salon.${rewardHint}`,
    {
      navigate: { path: 'account', query: { section: 'growth' } },
      salonShareEnabled: view.salonShareEnabled,
    },
  );
}

export async function handleShareMyBookingLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('share_my_booking', 'Sign in to share a booking.', { clarify: true });
  }
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (!slug) return failure('share_my_booking', 'Business not found.');

  const view = await deps.publicBookingService.getCustomerShareRewards(slug, customerId);
  const rewardHint = view.bookingShareEnabled
    ? ` You can earn ${view.bookingRewardSummary} when you share a booking.`
    : '';
  return success(
    'share_my_booking',
    `Open Account → My bookings and tap Share booking on a confirmed visit.${rewardHint}`,
    {
      navigate: { path: 'account', query: {} },
      bookingShareEnabled: view.bookingShareEnabled,
    },
  );
}

export async function handleFindMySavedSalonsLogic(
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const recentSalons = Array.isArray(params.recentSalons)
    ? params.recentSalons
        .filter(
          (entry): entry is { slug: string; name: string } =>
            !!entry &&
            typeof entry === 'object' &&
            typeof (entry as { slug?: string }).slug === 'string' &&
            typeof (entry as { name?: string }).name === 'string',
        )
        .slice(0, 8)
    : [];

  if (recentSalons.length === 0) {
    return success(
      'find_my_saved_salons',
      'Recently visited salons are saved on this device. Open the app home screen or tap the salon switcher to jump back to a place you booked before.',
      { recentSalons: [], navigate: { path: 'home', query: {} } },
    );
  }

  const lines = recentSalons.map((salon) => `• ${salon.name}`).join('\n');
  return success(
    'find_my_saved_salons',
    `Salons saved on this device:\n${lines}`,
    {
      recentSalons,
      navigate: { path: 'home', query: {} },
    },
  );
}

export async function dispatchConsumerAdoptionIntent(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult | null> {
  switch (action) {
    case 'explain_my_notifications':
      return handleExplainMyNotificationsLogic(businessId, params);
    case 'manage_notification_preferences':
      return handleManageNotificationPreferencesLogic(
        deps,
        businessId,
        params,
        prompt,
      );
    case 'refer_a_friend':
      return handleReferAFriendLogic(deps, businessId, params);
    case 'share_salon_link':
      return handleShareSalonLinkLogic(deps, businessId, params);
    case 'share_my_booking':
      return handleShareMyBookingLogic(deps, businessId, params);
    case 'rebook_last_appointment':
      return handleRebookLastAppointmentLogic(deps, businessId, params);
    case 'find_my_saved_salons':
      return handleFindMySavedSalonsLogic(params);
    default:
      return null;
  }
}
