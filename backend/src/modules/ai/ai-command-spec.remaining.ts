/**
 * AI-ROADMAP Phase 1 - tenth slice: the last six modules before the catch-all.
 *
 * 115 entries across `booking` (13), `consumer-adoption` (17), `integrations`
 * (22), `marketing-growth` (27), `provider-exp-2` (14) and `push-notifications`
 * (22). With this, every module except `ai-command` is ported.
 *
 * One compensation shape is new here: **credentials**. `create_api_key`,
 * `rotate_api_key`, `configure_openai_integration`, `configure_stripe_connect`
 * and `configure_whatsapp_integration` are `none` because a secret is shown
 * once - reversing its creation does not un-reveal it, and reversing a rotation
 * does not restore a key the caller has already discarded. `revoke_api_key` is
 * `manual` for the mirror reason: whatever used the key has already broken, and
 * reissuing produces a different one.
 *
 * `regenerate_tenant_app_install_qr` is `manual` on the same logic applied to
 * something physical - printed copies of the old code stop working and cannot
 * be recalled.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const REMAINING_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'marketing.apply_loyalty_at_checkout',
    aliases: ['apply_loyalty_at_checkout'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Apply loyalty points to reduce a checkout total.',
    variables: {
      // `handleApplyLoyaltyAtCheckoutLogic` -> `parseApplyLoyaltyAtCheckoutFromPrompt`
      // -> `readLoyaltyPointsParam`, which accepts `loyaltyPointsToRedeem` |
      // `loyaltyPoints` | `pointsToRedeem`. One spelling declared, as on
      // `update_service_prices`.
      //
      // `sessionCustomerId` / `customerId` are read too and deliberately not
      // declared — session-injected, the standing exclusion.
      loyaltyPointsToRedeem: {
        type: 'string',
        description:
          'Points to spend, or "max". Defaults to "max"; capped at the balance and at the order total either way.',
        required: false,
        resolver: 'none',
      },
      orderAmount: {
        type: 'number',
        description:
          'Total the points are redeemed against, which is what caps the redemption. Falls back to `servicePrice`, then to a placeholder of 100.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['use my points', 'apply loyalty at checkout'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.apply_promo_code_checkout',
    aliases: ['apply_promo_code_checkout'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Apply a promo code to a checkout.',
    variables: {
      // `handleApplyPromoCodeCheckoutLogic`. The code is read from
      // `promoCode` | `code`, then falls back to
      // `extractApplyPromoCodeFromPrompt`. Not required despite the handler
      // reporting `missing: ['promoCode']` — that branch is only reached when
      // the message has no code in it either.
      promoCode: {
        type: 'string',
        description:
          'Code to apply. Falls back to a code found in the message.',
        required: false,
        resolver: 'none',
      },
      orderAmount: {
        type: 'number',
        description:
          'Total the discount applies to. Falls back to `servicePrice`, then to a placeholder of 100.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['use code SAVE20', 'apply my promo code'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.appointment_reminder_preferences',
    aliases: ['appointment_reminder_preferences'],
    domain: 'push',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Change when appointment reminders are sent.',
    // §177 (C2/T1) — `handleAppointmentReminderPreferencesLogic` reads
    // `reminderHoursBefore`, falling back to `extractReminderHoursFromPrompt`.
    // The customer comes from `resolveSessionCustomerId` (session state), so it
    // is not user input and is not declared.
    variables: {
      reminderHoursBefore: {
        type: 'number',
        description:
          'How many hours before the appointment to send the reminder. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['remind me a day before', 'change my reminder timing'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'push.appointment_reminder_preferences',
      captures: ['previousPreferences'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'booking.assign_resource',
    aliases: ['assign_booking_resource'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Assign a room or piece of equipment to a booking.',
    // §177 (C2/T1) — both fields are required together: the handler refuses with
    // `missing: ['bookingId', 'resourceName']`.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking the resource is assigned to.',
        required: true,
        resolver: 'appointment',
      },
      resourceName: {
        type: 'string',
        description: 'Room, chair or equipment being assigned.',
        required: true,
        resolver: 'none',
      },
    },
    examples: [
      'put that booking in room 2',
      'assign a chair to this appointment',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'booking.assign_resource',
      captures: ['bookingId', 'previousResourceId'],
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.cancel_multi_service_group',
    aliases: ['cancel_multi_service_group'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Cancel a whole multi-service visit.',
    variables: {
      // `handleCancelMultiServiceGroupLogic`. `bookingId` is any one line of
      // the visit — the handler expands it to the whole group, which is what
      // makes this different from cancelling a single appointment.
      bookingId: {
        type: 'string',
        description:
          'Any booking in the visit. The entire multi-service group is cancelled, not just this line.',
        required: false,
        resolver: 'appointment',
      },
      reason: {
        type: 'string',
        description: 'Cancellation reason recorded against the bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['cancel that whole spa day', 'cancel the multi service booking'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the visit is cancelled and the slots may already be taken.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.cancel_package_visit',
    aliases: ['cancel_package_visit'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Cancel one visit from a package.',
    // §177 (C2/T1) — the staff-side cancel, distinct from the customer's
    // `cancel_package_visit_self`: it takes a booking id outright rather than
    // resolving one from the session.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Package visit to cancel. The handler refuses without it.',
        required: true,
        resolver: 'appointment',
      },
      reason: {
        type: 'string',
        description: 'Reason recorded against the cancellation.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'cancel their package visit on friday',
      'drop that package session',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The customer has been told the visit is cancelled and the slot may already be taken.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'provider.check_in_client',
    aliases: ['check_in_client'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Check a client in for their appointment.',
    // §177 (C2/T1) — identification via `resolveBookingForProviderAction`, which
    // tries `bookingId` (then `context.bookingId`), and otherwise
    // `extractBookingActionCustomerName` — which reads `params.customerName` one
    // level down, so a grep of the resolver alone under-reports it.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking in context.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client whose booking it is, when no id is given. The handler refuses with `missing: [bookingId, customerName]` if neither resolves.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Appointment time, used to disambiguate same-day bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['check them in', 'my 3pm has arrived'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'provider.check_in_client',
      captures: ['bookingId', 'previousStatus'],
    },
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'adoption.claim_referral_code',
    aliases: ['claim_referral_code'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Claim a referral code for a reward.',
    variables: {
      // e2e-bug.410 — the handler has always read `params.referralCode`; the
      // spec declared no variables at all, so the planner had no way to know the
      // command takes one. Optional, not required: "use my invite code" is a
      // documented example of this command and names no code, and the handler
      // asks for it when it is missing.
      referralCode: {
        type: 'string',
        description: 'The referral or invite code the customer was given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['claim referral code FRIEND10', 'use my invite code'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'adoption.claim_share_reward',
    aliases: ['claim_share_reward'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Claim a reward earned by sharing.',
    variables: {
      // `handleClaimShareRewardLogic`. The customer comes from the session.
      bookingId: {
        type: 'string',
        description: 'Booking that was shared.',
        required: false,
        resolver: 'appointment',
      },
      channel: {
        type: 'string',
        description: 'Where it was shared, which decides the reward rule.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['claim my share reward', 'give me my sharing bonus'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'integration.configure_distribution_channels',
    aliases: ['configure_distribution_channels'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change where bookings can be taken from.',
    // §177 (C2/T1) — eleven channel settings, all read directly by
    // `handleConfigureDistributionChannelsLogic`.
    variables: {
      googleReserveEnabled: {
        type: 'boolean',
        description: 'Enable Reserve with Google.',
        required: false,
        resolver: 'none',
      },
      googleMerchantId: {
        type: 'string',
        description: 'Google merchant id.',
        required: false,
        resolver: 'none',
      },
      googlePartnerNotes: {
        type: 'string',
        description: 'Notes for the Google partner listing.',
        required: false,
        resolver: 'none',
      },
      metaBookingEnabled: {
        type: 'boolean',
        description: 'Enable booking through Meta surfaces.',
        required: false,
        resolver: 'none',
      },
      facebookPageId: {
        type: 'string',
        description: 'Facebook page id.',
        required: false,
        resolver: 'none',
      },
      facebookPageUrl: {
        type: 'string',
        description: 'Facebook page URL.',
        required: false,
        resolver: 'none',
      },
      instagramUsername: {
        type: 'string',
        description: 'Instagram handle.',
        required: false,
        resolver: 'none',
      },
      whatsappBookingEnabled: {
        type: 'boolean',
        description: 'Enable booking through WhatsApp.',
        required: false,
        resolver: 'none',
      },
      whatsappBusinessPhone: {
        type: 'string',
        description: 'WhatsApp Business phone number.',
        required: false,
        resolver: 'none',
      },
      telegramEnabled: {
        type: 'boolean',
        description: 'Enable the Telegram channel.',
        required: false,
        resolver: 'none',
      },
      telegramBotUsername: {
        type: 'string',
        description: 'Telegram bot username.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'turn on the marketplace channel',
      'configure distribution channels',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'integration.configure_distribution_channels',
      captures: ['previousChannels'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.configure_loyalty_settings',
    aliases: ['configure_loyalty_settings'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change how loyalty points are earned and spent.',
    // §177 slice 25 — **corrected twice**. Exempted as prompt-parsed, then cleared
    // again by slice 16's own re-audit, because the reads are **three hops** from
    // the handler: `parseConfigureLoyaltySettingsFromPrompt` calls
    // `readBooleanParam(params, 'enabled', 'loyaltyEnabled')`,
    // `readNumberParam(params, 'earnPercentCashback', 'earnPercent')` and
    // `readUuidArrayParam(params, 'earnExcludedServiceIds')`. Each takes two key
    // names, which is where the alias pairs below come from.
    variables: {
      enabled: {
        type: 'boolean',
        description:
          'Turn the loyalty programme on or off. `loyaltyEnabled` is an alias.',
        required: false,
        resolver: 'none',
      },
      loyaltyEnabled: {
        type: 'boolean',
        description: 'Alias for `enabled`.',
        required: false,
        resolver: 'none',
      },
      earnPercentCashback: {
        type: 'number',
        description: 'Cashback percentage earned. `earnPercent` is an alias.',
        required: false,
        resolver: 'none',
      },
      earnPercent: {
        type: 'number',
        description: 'Alias for `earnPercentCashback`.',
        required: false,
        resolver: 'none',
      },
      earnExcludedServiceIds: {
        type: 'string[]',
        description: 'Services that earn no loyalty cashback.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['change our loyalty rules', 'configure loyalty settings'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'marketing.configure_loyalty_settings',
      captures: ['previousValues'],
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.configure_marketing_automation',
    aliases: ['configure_marketing_automation'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the automated marketing messages.',
    // §177 (C2/T1) — `handleConfigureMarketingAutomationLogic` reads all seven
    // directly; it refuses with `missing: ['reEngagementEnabled']`.
    variables: {
      reEngagementEnabled: {
        type: 'boolean',
        description: 'Turn re-engagement messaging on or off.',
        required: true,
        resolver: 'none',
      },
      inactiveDaysThreshold: {
        type: 'number',
        description: 'Days of inactivity before a customer is re-engaged.',
        required: false,
        resolver: 'none',
      },
      minDaysBetweenReEngagement: {
        type: 'number',
        description:
          'Minimum gap between re-engagement messages to one customer.',
        required: false,
        resolver: 'none',
      },
      reEngagementEmailEnabled: {
        type: 'boolean',
        description: 'Send re-engagement by email.',
        required: false,
        resolver: 'none',
      },
      reEngagementSmsEnabled: {
        type: 'boolean',
        description: 'Send re-engagement by SMS.',
        required: false,
        resolver: 'none',
      },
      reEngagementPromoCode: {
        type: 'string',
        description: 'Promo code offered in the re-engagement message.',
        required: false,
        resolver: 'none',
      },
      postVisitReviewEnabled: {
        type: 'boolean',
        description: 'Ask for a review after a visit.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'change our win back automation',
      'configure marketing automation',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'marketing.configure_marketing_automation',
      captures: ['previousValues'],
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'integration.configure_marketing_registration_email',
    aliases: ['configure_marketing_registration_email'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the marketing email sent on registration.',
    // §177 (C2/T1) — two settings, read directly.
    variables: {
      emailOnNewCustomerRegistration: {
        type: 'boolean',
        description: 'Email the marketing team when a customer registers.',
        required: false,
        resolver: 'none',
      },
      marketingTeamEmails: {
        type: 'string[]',
        description: 'Addresses that receive the registration email.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change our welcome email', 'configure the registration email'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'integration.configure_marketing_registration_email',
      captures: ['previousValues'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'push.configure_notification_settings',
    aliases: ['configure_notification_settings'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the business notification settings.',
    variables: {},
    examples: ['change what we notify on', 'configure notifications'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'push.configure_notification_settings',
      captures: ['previousValues'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.configure_openai',
    aliases: ['configure_openai_integration'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Configure the OpenAI integration and its credentials.',
    variables: {
      // `parseConfigureOpenaiIntegrationFromPrompt` reads `usePlatformDefault`
      // and `apiKey`. **Only the first is declared, deliberately.**
      //
      // `apiKey` is a live credential. Declaring it advertises to the planner
      // that a secret belongs in a structured command parameter — a value that
      // then travels through classification, plan validation, the confirmation
      // payload and trace persistence. The command remains fully usable
      // without it: the reply routes the operator to Settings → OpenAI, which
      // is where a key should be entered.
      //
      // e2e-bug.442 is the reason this is not merely a style preference: the
      // handler already returns `patch: parsed` in its details, and the raw key
      // survives `sanitizeCommandDetailsForClient` today.
      usePlatformDefault: {
        type: 'boolean',
        description:
          'Use the platform OpenAI account instead of the business own key.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['set up our OpenAI key', 'configure the AI integration'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A credential is shown once. Reversing its creation or rotation does not un-reveal it.',
    },
    // §224 — was `AiIntegrationsService`, which neither serves this command nor
    // delegates to the service that does. The dispatch map routes the alias to
    // `AiOpenaiIntegrationService`; single-surface, so this was simply wrong.
    handler: 'AiOpenaiIntegrationService',
  },
  {
    id: 'push.configure_push_recipients',
    aliases: ['configure_push_recipients'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change who receives push notifications.',
    // §177 (C2/T1) — `handleConfigurePushRecipientsLogic` reads `recipientNames`
    // and otherwise falls back to `extractPushRecipientNamesFromPrompt`; the ids
    // are then looked up by `resolveRecipientUserIds`.
    variables: {
      recipientNames: {
        type: 'string[]',
        description:
          'Staff who should receive push notifications. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['send alerts to managers only', 'change push recipients'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'push.configure_push_recipients',
      captures: ['previousRecipients'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'marketing.configure_stripe_connect',
    aliases: ['configure_stripe_connect'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Configure the Stripe Connect payout account.',
    variables: {
      // `handleConfigureStripeConnectLogic` -> `parseConfigureStripeConnectFromPrompt`.
      // `startOnboarding` is the one field read from params; `mode` and
      // `country` are produced by the parser from the message and never read
      // back, so declaring them would be e2e-bug.399's direction.
      startOnboarding: {
        type: 'boolean',
        description:
          'Begin Stripe onboarding rather than just reporting the current setup state.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['connect our stripe account', 'set up payouts'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A credential is shown once. Reversing its creation or rotation does not un-reveal it.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.configure_whatsapp',
    aliases: ['configure_whatsapp_integration'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Configure the WhatsApp messaging integration.',
    variables: {
      // `parseConfigureWhatsappIntegrationFromPrompt` reads twelve explicit
      // keys. **`accessToken` is deliberately not among the declared ones**,
      // on the rule the fourteenth slice set for `configure_openai`'s
      // `apiKey`: a spec must not advertise that a credential belongs in a
      // command parameter.
      //
      // This handler has the same `patch: parsed` detail as the OpenAI one,
      // so the same leak applies — recorded on e2e-bug.442 rather than filed
      // twice.
      usePlatformDefault: {
        type: 'boolean',
        description:
          'Use the platform WhatsApp account instead of the business own.',
        required: false,
        resolver: 'none',
      },
      phoneNumberId: {
        type: 'string',
        description: 'WhatsApp phone number id to send from.',
        required: false,
        resolver: 'none',
      },
      businessAccountId: {
        type: 'string',
        description: 'WhatsApp business account id.',
        required: false,
        resolver: 'none',
      },
      templateConfirmation: {
        type: 'string',
        description: 'Template used for booking confirmations.',
        required: false,
        resolver: 'none',
      },
      templateReminder: {
        type: 'string',
        description: 'Template used for reminders.',
        required: false,
        resolver: 'none',
      },
      templateLanguage: {
        type: 'string',
        description: 'Language the templates are registered in.',
        required: false,
        resolver: 'none',
      },
      fallbackTemplate: {
        type: 'string',
        description: 'Template used when the primary one is unavailable.',
        required: false,
        resolver: 'none',
      },
      fallbackLanguage: {
        type: 'string',
        description: 'Language of the fallback template.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['connect whatsapp', 'set up whatsapp messaging'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A credential is shown once. Reversing its creation or rotation does not un-reveal it.',
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.configure_zapier',
    aliases: ['configure_zapier'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Configure the Zapier integration.',
    // §177 (C2/T1) — `enabled` falls back to `resolveZapierEnabledFromPrompt`.
    variables: {
      enabled: {
        type: 'boolean',
        description: 'Turn the Zapier integration on or off.',
        required: false,
        resolver: 'none',
      },
      hookDescription: {
        type: 'string',
        description: 'Label for the Zapier hook.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['connect us to Zapier', 'set up zapier'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'integration.configure_zapier',
      captures: ['previousValues'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.configure_zendesk',
    aliases: ['configure_zendesk'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Configure the Zendesk integration.',
    // §177 (C2/T1) — `handleConfigureZendeskLogic` reads the connection settings
    // directly. **`apiToken` is a credential**: it is declared because the handler
    // genuinely reads it, but a natural-language planner should never be asked to
    // fill it from an utterance — see `e2e-bug.464`.
    variables: {
      subdomain: {
        type: 'string',
        description: 'Zendesk subdomain.',
        required: false,
        resolver: 'none',
      },
      apiUserEmail: {
        type: 'string',
        description: 'Zendesk API user email.',
        required: false,
        resolver: 'none',
      },
      apiToken: {
        type: 'string',
        description:
          'Zendesk API token. Credential — should be supplied through settings, not conversation (`e2e-bug.464`).',
        required: false,
        resolver: 'none',
      },
      enabled: {
        type: 'boolean',
        description: 'Turn the Zendesk integration on or off.',
        required: false,
        resolver: 'none',
      },
      syncCustomersEnabled: {
        type: 'boolean',
        description:
          'Sync customers into Zendesk. Falls back to `resolveZendeskSyncEnabledFromPrompt`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['connect Zendesk', 'set up our support integration'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'integration.configure_zendesk',
      captures: ['previousValues'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.confirm_billing_checkout',
    aliases: ['confirm_billing_checkout'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Confirm a completed subscription billing checkout.',
    variables: {
      // The fifth genuinely-required variable in the whole backlog.
      // `handleConfirmBillingCheckoutLogic` reads `params.sessionId` and
      // nothing else, and returns `missing: ['sessionId']` with no fallback —
      // there is nothing to guess from, since the id comes back in Stripe's
      // redirect URL.
      sessionId: {
        type: 'string',
        description:
          'Stripe checkout session to confirm, as returned in the redirect URL after checkout.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['confirm our plan payment', 'finish the billing checkout'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.confirm_booking_from_push',
    aliases: ['confirm_booking_from_push'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Confirm a booking from a notification.',
    // §178 (C2/T1, e2e-bug.463) — declarable at last: this command had no
    // executor until §178 implemented `handleConfirmBookingFromPushLogic`, so it
    // was the one T1 spec that could not be declared by reading a handler.
    // Resolution mirrors `open_booking_from_push`: explicit `bookingId`, then the
    // push payload, then the prompt.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to confirm. Falls back to the push payload, then the prompt.',
        required: false,
        resolver: 'appointment',
      },
      lastPush: {
        type: 'object',
        description:
          'Push payload carried by the client, used to recover the booking id.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['confirm that booking', 'accept it from the alert'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The customer has been told their booking is confirmed.',
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.contact_support',
    aliases: ['contact_support'],
    domain: 'integration',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how to reach support.',
    // §207 (C2/T0) — the ticket fields, plus the session customer.
    variables: {
      subject: {
        type: 'string',
        description: 'Ticket subject.',
        required: false,
        resolver: 'none',
      },
      body: {
        type: 'string',
        description: 'Ticket body.',
        required: false,
        resolver: 'none',
      },
      requesterName: {
        type: 'string',
        description: 'Who is raising it.',
        required: false,
        resolver: 'customer',
      },
      requesterEmail: {
        type: 'string',
        description: 'Reply-to address for the ticket.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer the ticket is raised for.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do I contact support', 'I need help from a person'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.create_api_key',
    aliases: ['create_api_key'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Create an API key for programmatic access.',
    variables: {
      // `handleCreateApiKeyLogic`. The name is a label only — the key itself
      // is generated server-side, which is why this command has an input at
      // all and `configure_openai` deliberately does not.
      apiKeyName: {
        type: 'string',
        description:
          'Label for the new key. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['create an api key', 'generate a new key'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A credential is shown once. Reversing its creation or rotation does not un-reveal it.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'booking.create_cash',
    aliases: ['create_booking_cash'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Create a booking to be paid in cash.',
    variables: {
      // `prepareCashCreateParamsLogic` reads no user parameter at all — it
      // checks the business accepts cash and stamps payment metadata. The
      // booking itself is then created by `bookingCore.handleCreateBooking`,
      // so the inputs below are that command's, reached one hop further than
      // the spec's `handler` suggests (e2e-bug.440's shape).
      serviceName: {
        type: 'string',
        description: 'Service being booked.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day of the appointment.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time.',
        required: false,
        resolver: 'datetime',
      },
      employeeName: {
        type: 'string',
        description: 'Provider for the appointment.',
        required: false,
        resolver: 'employee',
      },
      customerName: {
        type: 'string',
        description: 'Who the appointment is for.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
      notes: {
        type: 'string',
        description: 'Notes recorded on the booking.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book them in, paying cash', 'create a cash booking'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.create_subscription_credit',
    aliases: ['create_booking_subscription_credit'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Create a booking paid with a subscription credit.',
    variables: {
      // `prepareSubscriptionCreditParamsLogic` resolves the customer and
      // service to find a matching active subscription, then hands off to
      // `bookingCore.handleCreateBooking` — same two-stage shape as
      // `create_cash`.
      //
      // The customer matters more here than on an ordinary booking: the
      // credit is drawn from *their* subscription, so a wrong match spends
      // someone else's visit.
      customerName: {
        type: 'string',
        description:
          'Whose subscription the credit is drawn from, and who the booking is for.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
      serviceName: {
        type: 'string',
        description:
          'Service being booked. Also selects which subscription plan can cover it.',
        required: false,
        resolver: 'service',
      },
      serviceId: {
        type: 'string',
        description: 'Service by id. Takes precedence over the name.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day of the appointment.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time.',
        required: false,
        resolver: 'datetime',
      },
      employeeName: {
        type: 'string',
        description: 'Provider for the appointment.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['book them using their membership', 'use a subscription credit'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.create_multi_service',
    aliases: ['create_multi_service_booking'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Create a visit covering several services.',
    variables: {
      // `handleCreateMultiServiceBookingLogic`. Its three `missing:` payloads
      // name `serviceNames`, then `employeeName`/`date`/`timeSlot` — the
      // services are resolved first and the rest only asked for once they
      // match, which is why none is `required`.
      serviceNames: {
        type: 'string[]',
        description: 'Services to book into one visit.',
        required: false,
        resolver: 'service',
      },
      date: {
        type: 'string',
        description: 'Day of the visit.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time of the first service in the block.',
        required: false,
        resolver: 'datetime',
      },
      employeeName: {
        type: 'string',
        description: 'Provider for the visit.',
        required: false,
        resolver: 'employee',
      },
      employeeId: {
        type: 'string',
        description: 'Provider by id. Takes precedence over the name.',
        required: false,
        resolver: 'employee',
      },
      customerName: {
        type: 'string',
        description: 'Who the visit is for.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
      notes: {
        type: 'string',
        description: 'Notes recorded on the bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book them a massage and a facial', 'create a spa day booking'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.create_package',
    aliases: ['create_package_booking'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Create the bookings that make up a package.',
    variables: {
      // `handleCreatePackageBookingLogic`.
      packageName: {
        type: 'string',
        description: 'Package to book.',
        required: false,
        resolver: 'none',
      },
      packageLines: {
        type: 'object[]',
        description:
          'Per-service overrides within the package block, when the visits are not all with the same provider at the default times.',
        required: false,
        resolver: 'none',
      },
      date: {
        type: 'string',
        description: 'Day of the package block.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time of the block.',
        required: false,
        resolver: 'datetime',
      },
      employeeName: {
        type: 'string',
        description: 'Provider for the block.',
        required: false,
        resolver: 'employee',
      },
      customerName: {
        type: 'string',
        description: 'Who the package is for.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
      notes: {
        type: 'string',
        description: 'Notes recorded on the bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book their bridal package', 'schedule the package visits'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'marketing.create_promo_code',
    aliases: ['create_promo_code'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Create a promotional discount code.',
    // §177 slice 16 — **corrected**. Earlier exempted as prompt-parsed on a grep of
    // the handler body, which showed only `params._prompt`. The reads happen inside
    // `parseCreatePromoCodeFromPrompt`, one level down. The remaining fields
    // (discountValue, minOrderAmount, maxUses, expiresAt) are prompt-only.
    variables: {
      code: {
        type: 'string',
        description: 'The promo code itself.',
        required: false,
        resolver: 'none',
      },
      discountType: {
        type: 'string',
        description: 'Percent or fixed discount.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'create a code for 20 percent off',
      'make a promo code',
      'Create a promo code QATEST20 for 20 percent off',
      'Create a 15% off promo code called SUMMER15 valid this month',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'marketing.deactivate_promo_code',
      captures: ['promoCodeId'],
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'integration.create_support_ticket',
    aliases: ['create_support_ticket'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Raise a support ticket.',
    // §177 (C2/T1) — the widest input set in this cluster. The customer is
    // resolved from `customerId` or `customerName` via `resolveCustomerByName`;
    // `guideSnapshot` is parsed by `parseGuideSupportSnapshot`.
    variables: {
      subject: {
        type: 'string',
        description: 'Ticket subject.',
        required: false,
        resolver: 'none',
      },
      body: {
        type: 'string',
        description: 'Ticket body.',
        required: false,
        resolver: 'none',
      },
      tags: {
        type: 'string[]',
        description: 'Tags applied to the ticket.',
        required: false,
        resolver: 'none',
      },
      customerId: {
        type: 'string',
        description: 'Customer the ticket is about, when the id is known.',
        required: false,
        resolver: 'customer',
      },
      customerName: {
        type: 'string',
        description: 'Customer the ticket is about, resolved by name.',
        required: false,
        resolver: 'customer',
      },
      bookingId: {
        type: 'string',
        description: 'Booking the ticket relates to.',
        required: false,
        resolver: 'appointment',
      },
      requesterName: {
        type: 'string',
        description: 'Name of the person raising the ticket.',
        required: false,
        resolver: 'none',
      },
      requesterEmail: {
        type: 'string',
        description: 'Reply-to address for the ticket.',
        required: false,
        resolver: 'none',
      },
      snapshot: {
        type: 'object',
        description: 'Client state attached to the ticket.',
        required: false,
        resolver: 'none',
      },
      guideSnapshot: {
        type: 'object',
        description:
          'Product-guide context, parsed by `parseGuideSupportSnapshot`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['raise a ticket about this', 'open a support case'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'The ticket has reached the support queue; withdrawing it needs the same team.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.create_webhook',
    aliases: ['create_webhook'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Create a webhook endpoint.',
    // §177 (C2/T1) — `handleCreateWebhookLogic` refuses without either `url` or
    // `events`, each with its own `missing` hint.
    variables: {
      url: {
        type: 'string',
        description: 'Endpoint the webhook posts to.',
        required: true,
        resolver: 'none',
      },
      events: {
        type: 'string[]',
        description: 'Events that trigger the webhook.',
        required: true,
        resolver: 'none',
      },
      description: {
        type: 'string',
        description: 'Human-readable label for the webhook.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a webhook for new bookings', 'create a webhook'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'integration.delete_webhook',
      captures: ['webhookId'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.deactivate_promo_code',
    aliases: ['deactivate_promo_code'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Stop a promotional code working.',
    // §177 (C2/T1) — either identifier; the handler refuses with
    // `missing: ['code']`. Note its sibling `create_promo_code` is prompt-parsed,
    // so the pair reads its inputs two different ways.
    variables: {
      code: {
        type: 'string',
        description: 'Promo code to turn off.',
        required: true,
        resolver: 'none',
      },
      promoId: {
        type: 'string',
        description: 'Promo id, as an alternative to the code.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['kill that promo code', 'deactivate SAVE20'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Customers may already have been given the code; reactivating does not undo refusals in between.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'integration.delete_webhook',
    aliases: ['delete_webhook'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Delete a webhook endpoint.',
    // §177 (C2/T1) — identification is the whole input, via `resolveWebhookTarget`
    // (`webhookId` then `url`).
    variables: {
      webhookId: {
        type: 'string',
        description: 'Webhook to act on.',
        required: false,
        resolver: 'none',
      },
      url: {
        type: 'string',
        description: 'Webhook URL, used to identify it when no id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['delete that webhook', 'remove the booking webhook'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Events fired while it was absent are not replayed when it is recreated.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'push.dismiss_push',
    aliases: ['dismiss_push'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Dismiss a notification.',
    variables: {},
    examples: ['dismiss that alert', 'clear this notification'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'push.dismiss_push',
      captures: ['notificationId', 'previousStatus'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'provider.draft_review_response',
    aliases: ['draft_review_response'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Draft a reply to a customer review.',
    // §206 (C2/T0) — `resolveTargetReviewForDraftResponse` reads the review,
    // then falls back to `extractBookingActionCustomerName`.
    variables: {
      reviewId: {
        type: 'string',
        description: 'Review being replied to.',
        required: false,
        resolver: 'none',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the review when no id is given.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'draft a reply to that review',
      'help me respond to this review',
    ],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'push.enable_notifications',
    aliases: ['enable_notifications'],
    domain: 'push',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Turn notifications on.',
    variables: {},
    examples: ['turn on notifications', 'enable alerts'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'push.enable_notifications',
      captures: ['previousEnabled'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'push.end_of_day_summary',
    aliases: ['end_of_day_summary'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise the day at close.',
    // §205 (C2/T0) — the summary is per provider.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider the summary is for.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how did today go', 'end of day summary'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'adoption.explain_analytics_consent',
    aliases: ['explain_analytics_consent'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain what analytics data is collected and why.',
    // §200 (C2/T0) — `resolveConsumerAnalyticsConsentExplainContext` delegates
    // to `resolveAnalyticsConsentState`, which reads all four consent shapes.
    variables: {
      analyticsConsent: {
        type: 'string',
        description:
          'Consent value: granted, denied, pending, or a boolean/null.',
        required: false,
        resolver: 'none',
      },
      analyticsConsentGranted: {
        type: 'boolean',
        description: 'Consent granted, as a flag.',
        required: false,
        resolver: 'none',
      },
      analyticsConsentDenied: {
        type: 'boolean',
        description: 'Consent denied, as a flag.',
        required: false,
        resolver: 'none',
      },
      analyticsConsentPending: {
        type: 'boolean',
        description: 'Consent not yet answered, as a flag.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what data do you collect', 'explain analytics consent'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'push.explain_app_update_gate',
    aliases: ['explain_app_update_gate'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain why the app is blocking until updated.',
    // §205 (C2/T0) — the handler reads the gate state directly.
    variables: {
      blocked: {
        type: 'boolean',
        description: 'Whether the app is currently gated.',
        required: false,
        resolver: 'none',
      },
      currentVersion: {
        type: 'string',
        description: 'Version the app is running.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is the app blocking me', 'explain the update gate'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'adoption.explain_app_update_required',
    aliases: ['explain_app_update_required'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain why the app must be updated.',
    // §200 (C2/T0) — `resolveConsumerAppUpdateExplainContext` reads whether the
    // update nudge was already dismissed.
    variables: {
      appGateNudgeDismissed: {
        type: 'boolean',
        description: 'Update nudge already dismissed at the app gate.',
        required: false,
        resolver: 'none',
      },
      nudgeDismissed: {
        type: 'boolean',
        description: 'Update nudge already dismissed (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why do I need to update', 'explain the update requirement'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'booking.explain_policy',
    aliases: ['explain_booking_policy'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the booking and cancellation policy.',
    // §212 (C2/T0) — the booking whose policy is explained.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose policy is explained.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: ['what is the booking policy', 'how late can they cancel'],
    confirm: 'never',
    handler: 'AiBookingDepthService',
  },
  {
    id: 'adoption.explain_home_screen_widget',
    aliases: ['explain_home_screen_widget'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the home screen widget.',
    // §200 (C2/T0) — the handler reads `locale`;
    // `resolveConsumerHomeScreenWidgetExplainContext` reads the widget state.
    variables: {
      locale: {
        type: 'string',
        description: 'Locale for the explanation.',
        required: false,
        resolver: 'none',
      },
      homeScreenWidgetSupported: {
        type: 'boolean',
        description:
          'Whether the device supports the home-screen widget.',
        required: false,
        resolver: 'none',
      },
      widgetAuthed: {
        type: 'boolean',
        description: 'Whether the widget is signed in.',
        required: false,
        resolver: 'none',
      },
      hasNextAppointment: {
        type: 'boolean',
        description: 'Whether a next appointment exists.',
        required: false,
        resolver: 'none',
      },
      widgetHasNextAppointment: {
        type: 'boolean',
        description: 'Whether the widget shows a next appointment.',
        required: false,
        resolver: 'none',
      },
      nextServiceName: {
        type: 'string',
        description: 'Service on the next appointment.',
        required: false,
        resolver: 'service',
      },
      widgetNextServiceName: {
        type: 'string',
        description: 'Service the widget shows for the next appointment.',
        required: false,
        resolver: 'service',
      },
      widgetNextSubtitle: {
        type: 'string',
        description: 'Subtitle line the widget shows.',
        required: false,
        resolver: 'none',
      },
      hasQuickRebook: {
        type: 'boolean',
        description: 'Whether quick rebook is available.',
        required: false,
        resolver: 'none',
      },
      widgetHasQuickRebook: {
        type: 'boolean',
        description: 'Whether the widget offers quick rebook.',
        required: false,
        resolver: 'none',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is the widget for', 'how do I add the widget'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'integration.explain_health',
    aliases: ['explain_integration_health'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the health of an integration.',
    // §207 (C2/T0) — optionally narrowed to one integration.
    variables: {
      integrationFocus: {
        type: 'string',
        description: 'Integration the explanation is narrowed to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['why is zapier failing', 'explain the integration status'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'push.explain_last_push',
    aliases: ['explain_last_push'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the most recent notification.',
    // §205 (C2/T0) — `resolveLastPush` reads the push off params.
    variables: {
      lastPush: {
        type: 'object',
        description: 'The push being asked about.',
        required: false,
        resolver: 'none',
      },
      lastPushPayload: {
        type: 'object',
        description: 'Payload of that push, when sent separately.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what was that notification', 'explain the last alert'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'marketing.explain_loyalty_points',
    aliases: ['explain_loyalty_points'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how loyalty points work.',
    variables: {},
    examples: ['how do points work', 'explain loyalty'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.explain_my_notifications',
    aliases: ['explain_my_notifications'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the notifications the customer is receiving.',
    variables: {},
    examples: ['why am I getting these alerts', 'explain my notifications'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'push.explain_offline_mode',
    aliases: ['explain_offline_mode'],
    domain: 'push',
    surfaces: ['customer', 'provider'],
    tiers: {
      customer: ['client'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how the app behaves offline.',
    // §205 (C2/T0) — `resolveOfflineState` reads both spellings of each field.
    variables: {
      online: {
        type: 'boolean',
        description: 'Whether the device is online.',
        required: false,
        resolver: 'none',
      },
      isOnline: {
        type: 'boolean',
        description: 'Whether the device is online (alternate key).',
        required: false,
        resolver: 'none',
      },
      offlineQueueCount: {
        type: 'number',
        description: 'How many actions are queued offline.',
        required: false,
        resolver: 'none',
      },
      queuedCount: {
        type: 'number',
        description: 'How many actions are queued (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what happens if I lose signal', 'explain offline mode'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'adoption.explain_patient_alert',
    aliases: ['explain_patient_alert'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain an alert shown on the patient record.',
    // §200 (C2/T0) — `resolveConsumerPatientAlertExplainContext` reads the alerts.
    variables: {
      patientAlerts: {
        type: 'object[]',
        description: 'Alerts to explain.',
        required: false,
        resolver: 'none',
      },
      patientAlertCount: {
        type: 'number',
        description:
          'How many alerts there are, when the list is not sent.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is this alert', 'why am I flagged'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'marketing.explain_plan_entitlements',
    aliases: ['explain_plan_entitlements'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what the current plan includes.',
    variables: {},
    examples: ['what does our plan include', 'explain our entitlements'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.explain_plan_limits',
    aliases: ['explain_plan_limits'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the limits of the current plan.',
    variables: {},
    examples: ['what are our plan limits', 'how many staff can we have'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.explain_push_permission',
    aliases: ['explain_push_permission'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the push notification permission prompt.',
    // §200 (C2/T0) — the handler reads `pushReminders`, the local
    // `resolveNativePlatform` reads the platform pair, and
    // `resolvePushPermissionExplainContext` reads the permission pair.
    variables: {
      nativePlatform: {
        type: 'string',
        description: 'Device platform: ios or android.',
        required: false,
        resolver: 'none',
      },
      platform: {
        type: 'string',
        description: 'Device platform (alternate key).',
        required: false,
        resolver: 'none',
      },
      permissionState: {
        type: 'string',
        description: 'Current push permission state.',
        required: false,
        resolver: 'none',
      },
      pushPermissionState: {
        type: 'string',
        description: 'Current push permission state (alternate key).',
        required: false,
        resolver: 'none',
      },
      pushReminders: {
        type: 'boolean',
        description: 'Whether push reminders are switched on.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'why does it want notification permission',
      'explain the push prompt',
    ],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'provider.explain_request_review_flow',
    aliases: ['explain_request_review_flow'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how review requests are sent.',
    variables: {},
    examples: ['how do review requests work', 'explain the review flow'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'provider.explain_reviews_inbox',
    aliases: ['explain_reviews_inbox'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the reviews inbox.',
    // §206 (C2/T0) — `inferReviewsInboxPeriodFromPrompt` and
    // `inferReviewsInboxRatingFilterFromPrompt` read the two filters.
    variables: {
      period: {
        type: 'string',
        description: 'Window the inbox is scoped to.',
        required: false,
        resolver: 'none',
      },
      rating: {
        type: 'number',
        description: 'Only reviews at this rating.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is the reviews inbox', 'explain my reviews'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'adoption.explain_rewards_wallet',
    aliases: ['explain_rewards_wallet'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain the rewards wallet.',
    variables: {},
    examples: ['what is in my rewards wallet', 'explain my rewards'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'adoption.explain_share_reward',
    aliases: ['explain_share_reward'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how sharing earns a reward.',
    // §200 (C2/T0) — `resolveBusinessSlugFromParamsOrId` reads the slug.
    variables: {
      slug: {
        type: 'string',
        description: 'Business slug, used to build the share link.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how do share rewards work', 'what do I get for sharing'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'integration.explain_support_inbox',
    aliases: ['explain_support_inbox'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain the support inbox.',
    variables: {},
    examples: ['what is the support inbox', 'explain support messages'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.explain_app_install',
    aliases: ['explain_tenant_app_install'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how customers install the branded app.',
    variables: {},
    examples: ['how do customers get our app', 'explain app install'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.find_my_saved_salons',
    aliases: ['find_my_saved_salons'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'List the salons the customer has saved.',
    // §200 (C2/T0) — `parseFindMySavedSalonsFromPrompt` reads `aspect`;
    // `parseRecentSalonsFromParams` reads the roster.
    variables: {
      aspect: {
        type: 'string',
        description:
          'Which part of the saved-salon list is being asked about.',
        required: false,
        resolver: 'none',
      },
      recentSalons: {
        type: 'object[]',
        description: 'Recently visited salons held by the client.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what salons have I saved', 'show my saved places'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'marketing.how_to_download_app',
    aliases: ['how_to_download_app'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how to download the app.',
    variables: {},
    examples: ['how do I get the app', 'where do I download it'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'booking.list_cash_pending',
    aliases: ['list_cash_pending_bookings'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List bookings awaiting cash payment.',
    // §212 (C2/T0) — `resolveDateRange(params, prompt, tz)`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['who still owes cash', 'list cash pending bookings'],
    confirm: 'never',
    handler: 'AiBookingDepthService',
  },
  {
    id: 'marketing.list_inactive_customers',
    aliases: ['list_inactive_customers'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List customers who have not visited recently.',
    variables: {},
    examples: ['who has not been in for a while', 'list lapsed customers'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'integration.list_health',
    aliases: ['list_integration_health'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List integrations and whether they are working.',
    variables: {},
    examples: ['are our integrations ok', 'list integration health'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'booking.list_multi_service',
    aliases: ['list_multi_service_bookings'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List multi-service visits.',
    // §212 (C2/T0) — `resolveDateRange(params, prompt, tz)`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what spa days are booked', 'list multi service bookings'],
    confirm: 'never',
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.list_package',
    aliases: ['list_package_bookings'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List bookings that belong to packages.',
    // §212 (C2/T0) — `resolveDateRange(params, prompt, tz)`.
    variables: {
      date: {
        type: 'string',
        description: 'Day or anchor date for the window.',
        required: false,
        resolver: 'date',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what package visits are booked', 'list package bookings'],
    confirm: 'never',
    handler: 'AiBookingDepthService',
  },
  {
    id: 'marketing.list_promo_codes',
    aliases: ['list_promo_codes'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List promotional codes and their status.',
    // §190 (C2/T0) — one filter, read directly.
    variables: {
      activeOnly: {
        type: 'boolean',
        description: 'List only codes that are currently active.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what promo codes are live', 'list our codes'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.list_notifications',
    aliases: ['list_push_notifications'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the notifications this user has received.',
    variables: {},
    examples: ['show my notifications', 'what alerts do I have'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'provider.list_reassign_options',
    aliases: ['list_reassign_options'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List who a booking could be reassigned to.',
    // §206 (C2/T0) — `resolveBookingForProviderAction`.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Appointment being acted on.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Start time, used to pick between same-client appointments.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['who could take my 3pm', 'list reassign options'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'provider.list_team_unpaid_today',
    aliases: ['list_team_unpaid_today'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List today unpaid bookings across the team.',
    variables: {},
    examples: ['who has not paid today', 'team unpaid list'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'integration.list_webhooks',
    aliases: ['list_webhooks'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List configured webhooks.',
    variables: {},
    examples: ['what webhooks do we have', 'list our webhooks'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.list_zapier_triggers',
    aliases: ['list_zapier_triggers'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List the Zapier triggers available.',
    variables: {},
    examples: ['what can zapier trigger on', 'list zapier triggers'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.loyalty_points_balance',
    aliases: ['loyalty_points_balance'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Report a loyalty points balance.',
    // §190 (C2/T0) — reads only `sessionCustomerId`, which the pipeline injects.
    // Declared as nothing rather than exempted would be wrong either way, so it is
    // recorded here explicitly: the balance is scoped by who is asking.
    variables: {},
    examples: ['how many points do I have', 'my points balance'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.manage_notification_preferences',
    aliases: ['manage_notification_preferences'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Change which notifications the customer receives.',
    variables: {},
    examples: [
      'stop emailing me about offers',
      'change my notification settings',
    ],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'adoption.manage_notification_preferences',
      captures: ['previousPreferences'],
    },
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'push.mark_all_read',
    aliases: ['mark_all_notifications_read'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark every notification as read.',
    variables: {},
    examples: ['mark all as read', 'clear my notifications'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Which notifications were unread is not recorded before the bulk change.',
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'push.mark_booking_read',
    aliases: ['mark_booking_notifications_read'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark the notifications for a booking as read.',
    // §177 (C2/T1) — reads `bookingId`, falling back to
    // `extractBookingIdFromPushPrompt` and then to the last push payload.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking whose notifications should be marked read.',
        required: false,
        resolver: 'appointment',
      },
    },
    examples: [
      'mark that booking alerts read',
      'clear notifications for this booking',
    ],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'push.mark_booking_read',
      captures: ['bookingId', 'previousStatuses'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'push.mark_read',
    aliases: ['mark_notification_read'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark one notification as read.',
    // §177 (C2/T1) — the whole input is the notification id.
    variables: {
      notificationId: {
        type: 'string',
        description: 'Notification to mark as read.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['mark that read', 'I have seen this one'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'push.mark_read',
      captures: ['notificationId', 'previousStatus'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'provider.mark_ready_now',
    aliases: ['mark_ready_now'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Signal that the provider is ready now.',
    // §177 (C2/T1) — identification via `resolveBookingForProviderAction`, which
    // tries `bookingId` (then `context.bookingId`), and otherwise
    // `extractBookingActionCustomerName` — which reads `params.customerName` one
    // level down, so a grep of the resolver alone under-reports it.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking in context.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client whose booking it is, when no id is given. The handler refuses with `missing: [bookingId, customerName]` if neither resolves.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Appointment time, used to disambiguate same-day bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I am ready now', 'tell them I am free'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'The notification has been sent and cannot be unsent.',
    },
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'provider.mark_running_late',
    aliases: ['mark_running_late'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Signal that the provider is running late.',
    // §177 (C2/T1) — identification via `resolveBookingForProviderAction`, which
    // tries `bookingId` (then `context.bookingId`), and otherwise
    // `extractBookingActionCustomerName` — which reads `params.customerName` one
    // level down, so a grep of the resolver alone under-reports it. `minutesLate` is read by
    // `extractRunningLateMinutesFromPrompt`, which also falls back to the prompt.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking in context.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client whose booking it is, when no id is given. The handler refuses with `missing: [bookingId, customerName]` if neither resolves.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Appointment time, used to disambiguate same-day bookings.',
        required: false,
        resolver: 'none',
      },
      minutesLate: {
        type: 'number',
        description:
          'How late the provider is running. Extracted from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['I am running 15 minutes late', 'tell my clients I am behind'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason: 'The notification has been sent and cannot be unsent.',
    },
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'provider.my_stats',
    aliases: ['my_stats'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report the provider own performance statistics.',
    // §206 (C2/T0) — `inferMyStatsPeriodFromPrompt` and
    // `inferMyStatsScopeFromPrompt` read the window and the scope.
    variables: {
      period: {
        type: 'string',
        description: 'Window the stats cover.',
        required: false,
        resolver: 'none',
      },
      scope: {
        type: 'string',
        description: 'Whether the stats are personal or team-wide.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how am I doing', 'show my stats'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'push.new_booking_actions',
    aliases: ['new_booking_push_actions'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain what can be done from a new booking notification.',
    variables: {},
    examples: ['what can I do from this alert', 'new booking push actions'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'push.notification_history',
    aliases: ['notification_history'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List past notifications.',
    // §205 (C2/T0) — paged history.
    variables: {
      limit: {
        type: 'number',
        description: 'How many notifications to return.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show my notification history', 'what alerts have I had'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'push.offline_queue_status',
    aliases: ['offline_queue_status'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report what is waiting in the offline queue.',
    // §205 (C2/T0) — same `resolveOfflineState` pair as `explain_offline_mode`.
    variables: {
      online: {
        type: 'boolean',
        description: 'Whether the device is online.',
        required: false,
        resolver: 'none',
      },
      isOnline: {
        type: 'boolean',
        description: 'Whether the device is online (alternate key).',
        required: false,
        resolver: 'none',
      },
      offlineQueueCount: {
        type: 'number',
        description: 'How many actions are queued offline.',
        required: false,
        resolver: 'none',
      },
      queuedCount: {
        type: 'number',
        description: 'How many actions are queued (alternate key).',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what is stuck offline', 'offline queue status'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'marketing.open_billing_settings',
    aliases: ['open_billing_settings'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Open the billing settings view.',
    variables: {},
    examples: ['show me billing', 'open billing settings'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.open_booking_from_push',
    aliases: ['open_booking_from_push'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Open the booking a notification refers to.',
    // §205 (C2/T0) — the handler reads the booking; `resolveLastPush` falls
    // back to the push payload, then the prompt.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Booking to open.',
        required: false,
        resolver: 'appointment',
      },
      lastPush: {
        type: 'object',
        description: 'The push being asked about.',
        required: false,
        resolver: 'none',
      },
      lastPushPayload: {
        type: 'object',
        description: 'Payload of that push, when sent separately.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['open that booking', 'show me the booking from the alert'],
    confirm: 'never',
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'provider.open_dashboard_deep_link',
    aliases: ['open_dashboard_deep_link'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Open the matching dashboard view.',
    // §206 (C2/T0) — `extractBookingActionCustomerName` builds the deep link.
    variables: {
      customerName: {
        type: 'string',
        description: 'Client whose dashboard page is opened.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'open this on the dashboard',
      'take me to the dashboard for this',
    ],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'integration.open_ticket_for_order',
    aliases: ['open_ticket_for_order'],
    domain: 'integration',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Open the support ticket view for an order.',
    // §207 (C2/T0) — the same ticket fields, scoped to an order: the handler
    // reads whichever of the two order references it is given.
    variables: {
      subject: {
        type: 'string',
        description: 'Ticket subject.',
        required: false,
        resolver: 'none',
      },
      body: {
        type: 'string',
        description: 'Ticket body.',
        required: false,
        resolver: 'none',
      },
      requesterName: {
        type: 'string',
        description: 'Who is raising it.',
        required: false,
        resolver: 'customer',
      },
      requesterEmail: {
        type: 'string',
        description: 'Reply-to address for the ticket.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer the ticket is raised for.',
        required: false,
        resolver: 'customer',
      },
      sessionCustomerId: {
        type: 'string',
        description: 'Customer from the current session.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking the ticket is about.',
        required: false,
        resolver: 'appointment',
      },
      giftCardId: {
        type: 'string',
        description: 'Gift card order the ticket is about.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show the ticket for that order', 'open support for this order'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.promo_code_help',
    aliases: ['promo_code_help'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Help with using a promotional code.',
    // §190 (C2/T0) — two spellings of the same field, plus prompt extraction as
    // the fallback.
    variables: {
      promoCode: {
        type: 'string',
        description: 'Code the customer is asking about. `code` is an alias.',
        required: false,
        resolver: 'none',
      },
      code: {
        type: 'string',
        description: 'Alias for `promoCode`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['my promo code is not working', 'help with my code'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'provider.reassign_booking_same_day',
    aliases: ['reassign_booking_same_day'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Move a booking to a different provider today.',
    // §177 (C2/T1) — identification via `resolveBookingForProviderAction`, which
    // tries `bookingId` (then `context.bookingId`), and otherwise
    // `extractBookingActionCustomerName` — which reads `params.customerName` one
    // level down, so a grep of the resolver alone under-reports it. The destination provider is
    // required: the handler refuses with `missing: ['employeeName']`.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking in context.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client whose booking it is, when no id is given. The handler refuses with `missing: [bookingId, customerName]` if neither resolves.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Appointment time, used to disambiguate same-day bookings.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider the booking moves to.',
        required: true,
        resolver: 'employee',
      },
      employeeId: {
        type: 'string',
        description: 'Destination provider id, when known.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['give my 3pm to Mary', 'reassign that booking'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'provider.reassign_booking_same_day',
      captures: ['bookingId', 'previousEmployeeId'],
    },
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'adoption.rebook_last_appointment',
    aliases: ['rebook_last_appointment'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Offer to book the same thing the customer had last time.',
    // §200 (C2/T0) — `resolveBusinessSlugFromParamsOrId` reads the slug.
    variables: {
      slug: {
        type: 'string',
        description: 'Business slug the rebook applies to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['book what I had last time', 'same again please'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'adoption.refer_a_friend',
    aliases: ['refer_a_friend'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Explain how to refer a friend and what it gives.',
    variables: {},
    examples: ['how do I refer a friend', 'what is the referral scheme'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'marketing.regenerate_app_install_qr',
    aliases: ['regenerate_tenant_app_install_qr'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Regenerate the app install QR code.',
    variables: {},
    examples: ['make a new install QR', 'regenerate the app code'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Printed or shared copies of the old code stop working and cannot be recalled.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.register_customer_push',
    aliases: ['register_customer_push'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Register this device for push notifications.',
    // §177 (C2/T1) — `token` is the device push token: client-generated and
    // *presented*, like `manageToken`, not a secret being configured
    // (`e2e-bug.464`). Platform comes from `resolveNativePlatform`.
    variables: {
      token: {
        type: 'string',
        description: 'Device push token supplied by the client.',
        required: false,
        resolver: 'none',
      },
      permissionState: {
        type: 'string',
        description: 'Whether the OS permission was granted.',
        required: false,
        resolver: 'none',
      },
      analyticsAnonId: {
        type: 'string',
        description: 'Anonymous analytics id for the device.',
        required: false,
        resolver: 'none',
      },
      nativePlatform: {
        type: 'string',
        description: 'Client platform. `platform` is accepted as an alias.',
        required: false,
        resolver: 'none',
      },
      platform: {
        type: 'string',
        description: 'Alias for `nativePlatform`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['turn on notifications', 'register me for alerts'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'adoption.register_customer_push',
      captures: ['previousRegistration'],
    },
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'provider.request_client_review',
    aliases: ['request_client_review'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Ask a client to leave a review.',
    // §177 (C2/T1) — identification via `resolveBookingForProviderAction`, which
    // tries `bookingId` (then `context.bookingId`), and otherwise
    // `extractBookingActionCustomerName` — which reads `params.customerName` one
    // level down, so a grep of the resolver alone under-reports it.
    variables: {
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to the session booking in context.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client whose booking it is, when no id is given. The handler refuses with `missing: [bookingId, customerName]` if neither resolves.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Appointment time, used to disambiguate same-day bookings.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['ask them for a review', 'request a review from that client'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The notification has been sent and cannot be unsent.',
    },
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'booking.reschedule_multi_service_group',
    aliases: ['reschedule_multi_service_group'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Move a whole multi-service visit.',
    variables: {
      // `handleRescheduleMultiServiceGroupLogic`. Same group semantics as the
      // cancel twin: one line identifies the visit and the whole block moves.
      bookingId: {
        type: 'string',
        description:
          'Any booking in the visit. The entire multi-service group moves together.',
        required: false,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'Day to move the visit to.',
        required: false,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'Start time for the new block.',
        required: false,
        resolver: 'datetime',
      },
      employeeId: {
        type: 'string',
        description: 'Move the visit to a different provider at the same time.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['move that spa day to friday', 'reschedule the whole visit'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Moves several bookings at once; restoring them needs per-booking pre-state.',
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'booking.reschedule_package_visit',
    aliases: ['reschedule_package_visit'],
    domain: 'booking',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Move one visit from a package.',
    // §177 (C2/T1) — all three of booking, day and time are required together
    // (`missing: ['bookingId', 'date', 'timeSlot']`); the provider is optional.
    variables: {
      bookingId: {
        type: 'string',
        description: 'Package visit to move.',
        required: true,
        resolver: 'appointment',
      },
      date: {
        type: 'string',
        description: 'New day.',
        required: true,
        resolver: 'date',
      },
      timeSlot: {
        type: 'string',
        description: 'New time.',
        required: true,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Move to a different provider at the same time.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['move their package visit', 'reschedule that session'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'booking.reschedule_package_visit',
      captures: ['bookingId', 'originalStart'],
    },
    handler: 'AiBookingDepthService',
  },
  {
    id: 'push.retry_offline_action',
    aliases: ['retry_offline_action'],
    domain: 'push',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Retry an action queued while offline.',
    variables: {},
    examples: ['retry that queued action', 'try the offline action again'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason:
        'A retry re-runs the underlying command; undoing it means undoing that command.',
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.revoke_api_key',
    aliases: ['revoke_api_key'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Revoke an API key so it stops working immediately.',
    variables: {
      // `handleRevokeApiKeyLogic`. Immediate and unrecoverable — anything
      // using the key breaks at once — so which key is named is the whole
      // blast radius. The id is exact; the name is matched.
      keyId: {
        type: 'string',
        description:
          'Exact key to revoke. Takes precedence over the name; falls back to an id found in the message.',
        required: false,
        resolver: 'none',
      },
      apiKeyName: {
        type: 'string',
        description:
          'Key to revoke, by label. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['revoke that key', 'kill the old api key'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Anything using the key has already broken; reissuing gives a different key.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.rotate_api_key',
    aliases: ['rotate_api_key'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Rotate an API key, invalidating the old one.',
    variables: {
      // `handleRotateApiKeyLogic` — same identification pair as the revoke
      // twin, and the same immediacy: the old key stops working as soon as the
      // new one is issued.
      keyId: {
        type: 'string',
        description:
          'Exact key to rotate. Takes precedence over the name; falls back to an id found in the message.',
        required: false,
        resolver: 'none',
      },
      apiKeyName: {
        type: 'string',
        description:
          'Key to rotate, by label. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['rotate that api key', 'issue a new key and retire the old'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A credential is shown once. Reversing its creation or rotation does not un-reveal it.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'integration.run_accounting_export',
    aliases: ['run_accounting_export'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Run an export to the accounting system.',
    variables: {
      // `resolveAccountingDateRange(params, prompt)`. The range decides what
      // reaches the accounting system; both ends fall back to the message.
      from: {
        type: 'string',
        description: 'Start of the export period.',
        required: false,
        resolver: 'date',
      },
      to: {
        type: 'string',
        description: 'End of the export period.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['run the accounting export', 'push last month to accounting'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The data has left the system and cannot be recalled.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'adoption.share_salon_link',
    aliases: ['share_salon_link'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Give the customer a link to share the salon.',
    variables: {},
    examples: ['share this salon with a friend', 'send me the link to share'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'marketing.start_billing_checkout',
    aliases: ['start_billing_checkout'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Start checkout for a platform subscription plan.',
    variables: {
      // `handleStartBillingCheckoutLogic`. It reports `missing: ['planName']`,
      // but a `planId` satisfies it just as well — the "one of" shape, so
      // neither is required.
      planName: {
        type: 'string',
        description:
          'Plan to subscribe to. Used when the plan is named in words rather than by id.',
        required: false,
        resolver: 'none',
      },
      planId: {
        type: 'string',
        description:
          'Plan to subscribe to, by id. Takes precedence over the name.',
        required: false,
        resolver: 'none',
      },
      billingInterval: {
        type: 'string',
        description: 'Billing cadence. Anything other than "year" is monthly.',
        required: false,
        resolver: 'none',
        enum: ['month', 'year'],
      },
    },
    examples: ['upgrade our plan', 'start the billing checkout'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'provider.suggest_cancel_note',
    aliases: ['suggest_cancel_note'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Suggest wording for a cancellation message.',
    // §206 (C2/T0) — the handler reads an existing draft;
    // `resolveBookingForProviderAction` reads the appointment.
    variables: {
      draft: {
        type: 'string',
        description: 'Existing note draft to improve on.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Appointment being acted on.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description:
          'Client, used to find the appointment when no id is given.',
        required: false,
        resolver: 'customer',
      },
      timeSlot: {
        type: 'string',
        description:
          'Start time, used to pick between same-client appointments.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what should I say when cancelling',
      'draft a cancellation note',
    ],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'marketing.suggest_upgrade',
    aliases: ['suggest_upgrade'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Suggest a plan upgrade and explain why.',
    variables: {},
    examples: ['should we upgrade', 'what would a bigger plan give us'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.summarize_automation_performance',
    aliases: ['summarize_automation_performance'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Report how automated marketing is performing.',
    variables: {},
    examples: ['are our automations working', 'automation performance'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.summarize_loyalty_program',
    aliases: ['summarize_loyalty_program'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise how the loyalty programme is doing.',
    variables: {},
    examples: ['how is loyalty going', 'summarise the loyalty program'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'marketing.summarize_new_registrations',
    aliases: ['summarize_new_registrations'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise new customer registrations.',
    // §190 (C2/T0) — the window, via `resolveMarketingDateRange`, which accepts
    // either an explicit pair or a named range.
    variables: {
      from: {
        type: 'string',
        description: 'Start of the window.',
        required: false,
        resolver: 'date',
      },
      to: {
        type: 'string',
        description: 'End of the window.',
        required: false,
        resolver: 'date',
      },
      dateRange: {
        type: 'string',
        description:
          'A named range (this week, last month) instead of an explicit pair.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how many new customers', 'summarise registrations'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'adoption.switch_salon_tenant',
    aliases: ['switch_salon_tenant'],
    domain: 'customer',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Switch which salon the customer is viewing.',
    // §200 (C2/T0) — the handler reads `slug`;
    // `parseSwitchSalonTenantFromPrompt` reads the target salon;
    // `parseRecentSalonsFromParams` reads the roster.
    variables: {
      salonName: {
        type: 'string',
        description: 'Salon to switch to, by name.',
        required: false,
        resolver: 'none',
      },
      salonSlug: {
        type: 'string',
        description: 'Salon to switch to, by slug.',
        required: false,
        resolver: 'none',
      },
      slug: {
        type: 'string',
        description: 'Salon currently open.',
        required: false,
        resolver: 'none',
      },
      recentSalons: {
        type: 'object[]',
        description: 'Recently visited salons held by the client.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['switch to the other salon', 'change salon'],
    confirm: 'never',
    handler: 'AiConsumerAdoptionService',
  },
  {
    id: 'marketing.switch_to_consumer_app',
    aliases: ['switch_to_consumer_app'],
    domain: 'marketing',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how to switch to the customer app.',
    variables: {},
    examples: ['how do I see the customer app', 'switch to consumer view'],
    confirm: 'never',
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'integration.sync_customer_to_zendesk',
    aliases: ['sync_customer_to_zendesk'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Send a customer record to Zendesk.',
    variables: {
      // `resolveCustomerByName(…, params)`. Personal data leaves the system on
      // this one, so a wrong fuzzy match sends the wrong person's record to a
      // third party. The id is the exact form.
      customerName: {
        type: 'string',
        description:
          'Customer to sync. Falls back to a name found in the message.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description:
          'Exact customer to sync. Takes precedence over the name, which is a fuzzy match.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['sync this customer to zendesk', 'push them to support'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The data has left the system and cannot be recalled.',
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'provider.team_floor_status',
    aliases: ['team_floor_status'],
    domain: 'provider',
    surfaces: ['provider'],
    tiers: { provider: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report what the team is doing right now.',
    variables: {},
    examples: ['what is the floor doing', 'team status'],
    confirm: 'never',
    handler: 'AiProviderExp2Service',
  },
  {
    id: 'push.test_push',
    aliases: ['test_push'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Send a test notification.',
    variables: {},
    examples: ['send me a test notification', 'test push'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason: 'The notification has been sent and cannot be unsent.',
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.test_webhook',
    aliases: ['test_webhook'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Send a test event to a webhook and report the result.',
    // §207 (C2/T0) — names the webhook to fire.
    variables: {
      webhookId: {
        type: 'string',
        description: 'Webhook to send the test to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['test that webhook', 'does the webhook work'],
    confirm: 'never',
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.toggle_annual_billing',
    aliases: ['toggle_annual_billing'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Switch between monthly and annual billing.',
    variables: {
      // `handleToggleAnnualBillingLogic`. Falls back to the business's current
      // subscription plan, then to the default upgrade plan — so the common
      // "switch me to annual" needs nothing supplied.
      planId: {
        type: 'string',
        description:
          'Plan to price annually. Defaults to the plan already subscribed to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['switch us to annual billing', 'go back to monthly'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiMarketingGrowthService',
  },
  {
    id: 'push.toggle_business_email_on_customer_change',
    aliases: ['toggle_business_email_on_customer_change'],
    domain: 'push',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description:
      'Turn on or off the email sent when a customer changes a booking.',
    // §177 (C2/T1) — reads `enabled`, falling back to
    // `extractBusinessEmailOnCustomerChangeToggleFromPrompt`.
    variables: {
      enabled: {
        type: 'boolean',
        description:
          'Whether the business is emailed when a customer changes a booking. Parsed from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    // §127 — both existing examples say "reschedule"/"changes", and the planner
    // declined on cancellation phrasings while handling the reschedule ones. A
    // cancellation IS a customer changing a booking, and nothing here said so.
    //
    // These two are real traffic for this command (`action_changed_by IS NULL`,
    // so the classifier's own confident labels) and deliberately NOT the prompts
    // this was measured on — §88's held-out rule, and §126's reminder that spec
    // examples feed the embedding cache and can make a test score itself.
    //
    // The description is untouched: §88 rewrote one to be more accurate and cost
    // nine points by diluting its vector.
    examples: [
      'stop emailing us on changes',
      'notify us when customers reschedule',
      'Notify me whenever a customer cancels a booking today',
      'Turn off email alerts when customers cancel',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'push.toggle_business_email_on_customer_change',
      captures: ['previousEnabled'],
    },
    handler: 'AiPushNotificationsService',
  },
  {
    id: 'integration.toggle_webhook',
    aliases: ['toggle_webhook'],
    domain: 'integration',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Turn a webhook on or off.',
    // §177 (C2/T1) — `resolveWebhookTarget` for the webhook, plus the new state;
    // `enabled` falls back to `resolveWebhookEnabledFromPrompt`.
    variables: {
      webhookId: {
        type: 'string',
        description: 'Webhook to act on.',
        required: false,
        resolver: 'none',
      },
      url: {
        type: 'string',
        description: 'Webhook URL, used to identify it when no id is given.',
        required: false,
        resolver: 'none',
      },
      enabled: {
        type: 'boolean',
        description:
          'Turn the webhook on or off. Parsed from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['pause that webhook', 'turn the webhook back on'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'integration.toggle_webhook',
      captures: ['webhookId', 'previousEnabled'],
    },
    handler: 'AiIntegrationsService',
  },
  {
    id: 'marketing.trigger_reengagement',
    aliases: ['trigger_reengagement'],
    domain: 'marketing',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Send a re-engagement campaign to lapsed customers.',
    variables: {},
    examples: [
      'message customers who have not been in',
      'run the win back campaign',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The notification has been sent and cannot be unsent.',
    },
    handler: 'AiMarketingGrowthService',
  },
] as const;
