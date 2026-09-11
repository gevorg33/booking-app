import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { AiPushNotificationsService } from './ai-push-notifications.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import { enrichClaimReferralCodeParamsFromPrompt } from './ai-rewards-and-referral-claim.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
  getCustomerNotificationPreferences,
} from '../notifications/notification.types.js';
import { handleShareMyBookingLogic as handleShareMyBookingLogicCore } from './ai-share-my-booking.logic.js';
import { handleExplainShareRewardLogic as handleExplainShareRewardLogicCore } from './ai-explain-share-reward.logic.js';
import { buildMyNotificationsExplainCopy } from './ai-explain-my-notifications.util.js';
import { handleFindMySavedSalonsLogic } from './ai-find-my-saved-salons.logic.js';
import { handleSwitchSalonTenantLogic } from './ai-switch-salon-tenant.logic.js';
import { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';
import { handleCustomerEnablePushNotificationsLogic } from './ai-customer-enable-push-notifications.logic.js';
import { handleRegisterCustomerPushLogic } from './ai-register-customer-push.logic.js';
import { handleExplainPushRegistrationStatusLogic } from './ai-explain-push-registration-status.logic.js';
import { handleExplainPushPermissionLogic } from './ai-explain-push-permission.logic.js';
import { handleExplainOfflineModeLogic } from './ai-explain-offline-mode.logic.js';
import { handleExplainAppUpdateRequiredLogic } from './ai-explain-app-update-required.logic.js';
import { handleExplainAnalyticsConsentLogic } from './ai-explain-analytics-consent.logic.js';
import { handleExplainHomeScreenWidgetLogic } from './ai-explain-home-screen-widget.logic.js';
import { handleExplainPatientAlertLogic } from './ai-explain-patient-alert.logic.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

export { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';
export { handleFindMySavedSalonsLogic } from './ai-find-my-saved-salons.logic.js';
export { handleSwitchSalonTenantLogic } from './ai-switch-salon-tenant.logic.js';

export interface ConsumerAdoptionLogicDeps {
  publicCustomerAuthService: PublicCustomerAuthService;
  publicBookingService: PublicBookingService;
  pushNotifications: AiPushNotificationsService;
  notificationsService: NotificationsService;
  consumerPushTokenService: ConsumerPushTokenService;
  /** e2e-bug.125 — resolve booking slug from authenticated businessId. */
  businessRepo: EntityReader<Business>;
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

/** e2e-bug.82 / e2e-bug.125 — never require classifier-extracted slug. */
async function resolveBusinessSlug(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<string | null> {
  return resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
}

export async function handleExplainMyNotificationsLogic(
  deps: ConsumerAdoptionLogicDeps,
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

  const businessSettings =
    await deps.notificationsService.getBusinessSettings(businessId);
  let customerPrefs = DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES;
  try {
    const customer = await deps.publicCustomerAuthService.getCustomerById(
      businessId,
      customerId,
    );
    customerPrefs = getCustomerNotificationPreferences(customer.metadata);
  } catch {
    customerPrefs = DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES;
  }

  const copy = buildMyNotificationsExplainCopy({
    businessSettings,
    customerPrefs,
  });

  return success('explain_my_notifications', copy.summary, {
    navigate: { path: 'account', query: { section: 'notifications' } },
    channels: copy.salonChannels,
    confirmations: copy.confirmations,
    reminders: copy.reminders,
    pushNotifications: copy.pushNotifications,
    customerOptIn: copy.customerOptIn,
    businessSettings: copy.businessSettings,
  });
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

  const slug = await resolveBusinessSlug(deps, businessId, params);
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

export async function handleShareSalonLinkLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('share_salon_link', 'Sign in to share your salon link.', {
      clarify: true,
    });
  }
  const slug = await resolveBusinessSlug(deps, businessId, params);
  if (!slug) return failure('share_salon_link', 'Business not found.');

  const view = await deps.publicBookingService.getCustomerShareRewards(
    slug,
    customerId,
  );
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

export async function handleExplainRewardsWalletLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('explain_rewards_wallet', 'Sign in to view your rewards.', {
      clarify: true,
    });
  }
  const slug = await resolveBusinessSlug(deps, businessId, params);
  if (!slug) return failure('explain_rewards_wallet', 'Business not found.');

  const view = await deps.publicBookingService.getCustomerRewards(
    slug,
    customerId,
  );

  const parts: string[] = [];
  if (view.loyaltyEnabled && view.loyalty) {
    parts.push(
      `${view.loyalty.pointsBalance} loyalty points (≈ $${view.loyalty.pointsValue} value)`,
    );
  }
  if (view.promotions.length) {
    parts.push(
      `${view.promotions.length} active promotion(s): ${view.promotions.map((p) => p.code).join(', ')}`,
    );
  }
  const summary = parts.length
    ? `Your rewards wallet: ${parts.join(' and ')}.`
    : 'No loyalty points or active promotions in your rewards wallet yet.';

  return success('explain_rewards_wallet', summary, {
    loyaltyEnabled: view.loyaltyEnabled,
    loyalty: view.loyalty,
    promotions: view.promotions,
    navigate: { path: 'account', query: { section: 'rewards' } },
  });
}

export async function handleClaimReferralCodeLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  // e2e-bug.410 — read the code out of the prompt when the classifier did not
  // put it in params, which is every time it gets the action right.
  //
  // `enrichClaimReferralCodeParamsFromPrompt` already existed and was already
  // tested, but it was only called from the *rescue* path in
  // `ai-intent-rescue.service.ts`. `rescueClaimReferralCodeIntent` returns null
  // when the action is already `claim_referral_code`, so the enrichment ran only
  // when the classifier had been wrong about the action. It never was: all 96
  // stored attempts carry `action_changed_by = (none)`, empty params, and the
  // reply "What referral code would you like to claim?" — to a user who had just
  // typed the code.
  const enriched = enrichClaimReferralCodeParamsFromPrompt(
    prompt ?? '',
    params,
  );

  const customerId = resolveSessionCustomerId(enriched);
  if (!customerId) {
    return failure('claim_referral_code', 'Sign in to claim a referral code.', {
      clarify: true,
    });
  }
  const slug = await resolveBusinessSlug(deps, businessId, enriched);
  if (!slug) return failure('claim_referral_code', 'Business not found.');

  const referralCode =
    typeof enriched.referralCode === 'string'
      ? enriched.referralCode.trim()
      : undefined;
  if (!referralCode) {
    return failure(
      'claim_referral_code',
      'What referral code would you like to claim?',
      { clarify: true, missing: ['referralCode'] },
    );
  }

  const result = await deps.publicBookingService.claimCustomerReferralCode(
    slug,
    customerId,
    referralCode,
  );

  if (!result.attached) {
    const messages: Record<string, string> = {
      disabled: 'Referral rewards are not enabled for this business.',
      invalid_code: `I couldn't find a referral code matching "${referralCode}".`,
      already_attached: "You've already claimed a referral code.",
      self_referral: "You can't claim your own referral code.",
      not_eligible_existing_customer:
        'Referral rewards apply to new customers before their first completed visit.',
    };
    return failure(
      'claim_referral_code',
      messages[result.reason ?? ''] ?? 'Could not claim this referral code.',
      { referralCode, reason: result.reason },
    );
  }

  return success(
    'claim_referral_code',
    `Referral code ${result.referralCode} claimed${
      result.refereePromoCode
        ? ` — use promo code ${result.refereePromoCode} on your next booking`
        : ''
    }.`,
    {
      referralCode: result.referralCode,
      refereePromoCode: result.refereePromoCode ?? null,
    },
  );
}

export async function handleClaimShareRewardLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('claim_share_reward', 'Sign in to claim your reward.', {
      clarify: true,
    });
  }
  const slug = await resolveBusinessSlug(deps, businessId, params);
  if (!slug) return failure('claim_share_reward', 'Business not found.');

  const channel =
    params.channel === 'booking' || params.channel === 'salon'
      ? params.channel
      : undefined;
  if (!channel) {
    return failure(
      'claim_share_reward',
      'Did you share your booking or the salon link?',
      { clarify: true, missing: ['channel'] },
    );
  }
  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId : undefined;

  const result = await deps.publicBookingService.claimCustomerShareReward(
    slug,
    customerId,
    channel,
    bookingId,
  );

  if (!result.awarded) {
    const messages: Record<string, string> = {
      disabled: 'Share rewards are not enabled for this business.',
      cooldown: "You've already claimed a share reward recently.",
      no_reward: 'No reward is configured for this share.',
    };
    return failure(
      'claim_share_reward',
      messages[result.reason ?? ''] ?? 'Could not claim a share reward.',
      { channel, reason: result.reason },
    );
  }

  return success(
    'claim_share_reward',
    `Reward claimed for sharing your ${channel === 'booking' ? 'booking' : 'salon link'}.`,
    {
      channel,
      awarded: true,
    },
  );
}

export async function handleExplainShareRewardLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  return handleExplainShareRewardLogicCore(
    {
      publicBookingService: deps.publicBookingService,
      businessRepo: deps.businessRepo,
    },
    businessId,
    params,
    prompt,
  );
}

export async function handleShareMyBookingLogic(
  deps: ConsumerAdoptionLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  return handleShareMyBookingLogicCore(
    {
      publicBookingService: deps.publicBookingService,
      businessRepo: deps.businessRepo,
    },
    businessId,
    params,
    prompt,
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
      return handleExplainMyNotificationsLogic(deps, businessId, params);
    case 'manage_notification_preferences':
      return handleManageNotificationPreferencesLogic(
        deps,
        businessId,
        params,
        prompt,
      );
    case 'enable_push_notifications':
      return handleCustomerEnablePushNotificationsLogic(
        deps,
        businessId,
        params,
      );
    case 'explain_push_permission':
      return handleExplainPushPermissionLogic(deps, businessId, params, prompt);
    case 'register_customer_push':
      return handleRegisterCustomerPushLogic(deps, businessId, params);
    case 'explain_push_registration_status':
      return handleExplainPushRegistrationStatusLogic(deps, businessId, params);
    case 'explain_offline_mode':
      return handleExplainOfflineModeLogic(businessId, params, prompt);
    case 'explain_app_update_required':
      return handleExplainAppUpdateRequiredLogic(businessId, params, prompt);
    case 'explain_analytics_consent':
      return handleExplainAnalyticsConsentLogic(businessId, params, prompt);
    case 'explain_home_screen_widget':
      return handleExplainHomeScreenWidgetLogic(businessId, params, prompt);
    case 'explain_patient_alert':
      return handleExplainPatientAlertLogic(businessId, params, prompt);
    case 'refer_a_friend':
      return handleReferAFriendLogic(deps, businessId, params);
    case 'claim_referral_code':
      return handleClaimReferralCodeLogic(deps, businessId, params, prompt);
    case 'explain_share_reward':
      return handleExplainShareRewardLogic(deps, businessId, params, prompt);
    case 'share_salon_link':
      return handleShareSalonLinkLogic(deps, businessId, params);
    case 'share_my_booking':
      return handleShareMyBookingLogic(deps, businessId, params, prompt);
    case 'claim_share_reward':
      return handleClaimShareRewardLogic(deps, businessId, params);
    case 'explain_rewards_wallet':
      return handleExplainRewardsWalletLogic(deps, businessId, params);
    case 'rebook_last_appointment':
      return handleRebookLastAppointmentLogic(deps, businessId, params, prompt);
    case 'find_my_saved_salons':
      return handleFindMySavedSalonsLogic(params, prompt);
    case 'switch_salon_tenant':
      return handleSwitchSalonTenantLogic(params, prompt);
    default:
      return null;
  }
}
