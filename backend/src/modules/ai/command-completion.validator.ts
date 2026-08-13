import {
  ValidationIssue,
  ValidationResult,
  ResolvedCommand,
} from './command-completion.types.js';
import { getRequestedEmployeeNames } from './ai-orchestration.helpers.js';
import {
  isAiCmdEntityValidatedAction,
  validateAiCmdEntityFields,
} from './ai-cmd-entity-completion.util.js';
import { isClinicTestResultExtValidatedIntent } from './ai-command-entity-params.registry.js';
import {
  hasAvailabilityWhen,
  hasRequiredBookingDate,
  hasRequiredBookingStartTime,
  hasRescheduleNewTime,
  isBookingFirstAvailable,
} from './booking-time-completion.util.js';
import { parseCurrencyFromPrompt } from './ai-business-currency.util.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
} from './ai-business-tax.util.js';
import { parseConfigureStackedTaxRulesFromPrompt } from './ai-stacked-tax.util.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';
import { parseExplainDataRightsFromPrompt } from './ai-data-rights.util.js';
import { isPrivacyExportCustomerPrompt } from './ai-privacy-export.util.js';
import { isPrivacyDeleteCustomerPrompt } from './ai-privacy-delete.util.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
} from './ai-recommendation-product.util.js';
import { parseServiceOnlinePaymentConfig } from './ai-service-online-payment.util.js';
import { parseServiceDepositPolicyConfig } from './ai-service-deposit-policy.util.js';
import { parseConfigureServiceFeaturedFromPrompt } from './ai-configure-service-featured.util.js';
import { parseBulkAssignServicesCategoryFromPrompt } from './ai-bulk-assign-services-category.util.js';
import { parseConfigurePackageOnlinePaymentFromPrompt } from './ai-configure-package-online-payment.util.js';
import { parseConfigureNotificationSettingsFromPrompt } from './ai-notification-settings.util.js';
import { parseConfigureWhatsappIntegrationFromPrompt } from './ai-whatsapp-integration.util.js';
import { parseConfigureOpenaiIntegrationFromPrompt } from './ai-openai-integration.util.js';
import { parseBusinessLanguagesFromPrompt } from './ai-business-languages.util.js';
import { parseBusinessDateFormatFromPrompt } from './ai-business-date-format.util.js';
import { parsePackageLocalizedNamesFromPrompt } from './ai-package-localized-names.util.js';
import { parsePackageDisplayNameExplainFromPrompt } from './ai-package-display-name.util.js';
import { parseExplainTourBookingFromPrompt } from './ai-tour-booking.util.js';
import { parseExplainTourMeetingPointFromPrompt } from './ai-tour-meeting-point.util.js';
import { parseExplainAnyProviderOptionFromPrompt } from './ai-explain-any-provider-option.util.js';
import { parsePickProviderForServiceFromPrompt } from './ai-pick-provider-for-service.util.js';
import { parseSwitchProviderSameTimeFromPrompt } from './ai-switch-provider-same-time.util.js';
import { parseExplainProfessionalProfileFromPrompt } from './ai-explain-professional-profile.util.js';
import { parseExplainProviderAvailabilityFromPrompt } from './ai-explain-provider-availability.util.js';
import { parseExplainClinicBookingFromPrompt } from './ai-clinic-booking.util.js';
import { parseExplainLabPrepFromPrompt } from './ai-explain-lab-prep.util.js';
import { parseExplainClinicBookingFieldsFromPrompt } from './ai-explain-clinic-booking-fields.util.js';
import { parseExplainPublicIntakeFormFromPrompt } from './ai-explain-public-intake-form.util.js';
import { parseExplainGuestCheckoutFieldsFromPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { parseExplainWhySignInFromPrompt } from './ai-explain-why-sign-in.util.js';
import { parseSignInToManageBookingFromPrompt } from './ai-sign-in-to-manage-booking.util.js';
import { parseExplainManageBookingPageFromPrompt } from './ai-explain-manage-booking-page.util.js';
import { parseFixCheckoutValidationErrorFromPrompt } from './ai-fix-checkout-validation-error.util.js';
import { parseConfirmMyBookingDetailsFromPrompt } from './ai-confirm-my-booking-details.util.js';
import { parseAddBookingToCalendarFromPrompt } from './ai-add-booking-to-calendar.util.js';
import { parseGetDirectionsToSalonFromPrompt } from './ai-get-directions-to-salon.util.js';
import { parseExplainPreparationNotesFromPrompt } from './ai-explain-preparation-notes.util.js';
import { parseBookAnotherServiceFromPrompt } from './ai-book-another-service.util.js';
import { parseShareMyBookingFromPrompt } from './ai-share-my-booking.util.js';
import { parseListMyUpcomingAppointmentsFromPrompt } from './ai-list-my-upcoming-appointments.util.js';
import { parseExplainCancelPolicyFromPrompt } from './ai-explain-cancel-policy.util.js';
import { parseExplainDepositForfeitureFromPrompt } from './ai-explain-deposit-forfeiture.util.js';
import { parseExplainPackageVisitRulesFromPrompt } from './ai-explain-package-visit-rules.util.js';
import { parseExplainLoyaltyPointsFromPrompt } from './ai-explain-loyalty-points.util.js';
import { parseExplainMySubscriptionFromPrompt } from './ai-explain-my-subscription.util.js';
import { parseGetManageLinkFromPrompt } from './ai-get-manage-link.util.js';
import { parseRecoverLostManageLinkFromPrompt } from './ai-recover-lost-manage-link.util.js';
import { parseFindMySavedSalonsFromPrompt } from './ai-find-my-saved-salons.util.js';
import { parseSwitchSalonTenantFromPrompt } from './ai-switch-salon-tenant.util.js';
import { parseNotifyRunningLateFromPrompt } from './ai-notify-running-late.util.js';
import { parseLeaveVisitReviewFromPrompt } from './ai-leave-visit-review.util.js';
import { parseExplainPostVisitReviewPromptFromPrompt } from './ai-explain-post-visit-review-prompt.util.js';
import { parseExplainShareRewardFromPrompt } from './ai-explain-share-reward.util.js';
import { parseSignInAfterBookingFromPrompt } from './ai-sign-in-after-booking.util.js';
import { parseReportBookingProblemFromPrompt } from './ai-report-booking-problem.util.js';
import {
  parseCheckWaitlistStatusFromPrompt,
  parseJoinWaitlistFromPrompt,
} from './ai-customer-waitlist.util.js';
import { parseRebookLastAppointmentFromPrompt } from './ai-rebook-last-appointment.util.js';
import { parseApplyPromoCodeCheckoutFromPrompt } from './ai-apply-promo-code-checkout.util.js';
import { parseApplyLoyaltyAtCheckoutFromPrompt } from './ai-apply-loyalty-at-checkout.util.js';
import { parseClaimGiftCardBalanceFromPrompt } from './ai-claim-gift-card-balance.util.js';
import { parseResumePendingPaymentFromPrompt } from './ai-resume-pending-payment.util.js';
import { parseConsumerDiagnoseStripeCheckoutFailureFromPrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { parsePayAtVenueFallbackFromPrompt } from './ai-pay-at-venue-fallback.util.js';
import { parseResumeBookingDraftFromPrompt } from './ai-resume-booking-draft.util.js';
import { parseExplainSlotNoLongerAvailableFromPrompt } from './ai-explain-slot-no-longer-available.util.js';
import { parseExplainMultiServicePaymentReturnFromPrompt } from './ai-explain-multi-service-payment-return.util.js';
import { parseRetryFailedNetworkActionFromPrompt } from './ai-retry-failed-network-action.util.js';
import { parseExplainVoiceInputFromPrompt } from './ai-explain-voice-input.util.js';
import { parseSpeakAssistantReplyFromPrompt } from './ai-speak-assistant-reply.util.js';
import { parseGiveAiFeedbackFromPrompt } from './ai-give-ai-feedback.util.js';
import { parseExplainRtlLayoutFromPrompt } from './ai-explain-rtl-layout.util.js';
import { isDiagnoseStripeCheckoutFailurePrompt } from './ai-stripe-checkout-failure.util.js';
import { parseExplainTourDaySlotsFromPrompt } from './ai-tour-day-slots.util.js';
import { parseExplainCheckoutRecommendationsFromPrompt } from './ai-checkout-recommendations.util.js';
import { parseDismissRecommendationsFromPrompt } from './ai-dismiss-recommendations.util.js';
import { parseBuyGiftCardForSomeoneFromPrompt } from './ai-buy-gift-card-for-someone.util.js';
import { parseExplainConsumerCheckoutSuccessFromPrompt } from './ai-consumer-checkout-success.util.js';
import { parseExplainConsumerCheckoutTaxFromPrompt } from './ai-consumer-checkout-tax.util.js';
import { parseExplainCheckoutTaxFromPrompt } from './ai-checkout-tax.util.js';
import { parseExplainRecommendationAnalyticsFromPrompt } from './ai-recommendation-analytics.util.js';
import { parseSummarizeRecommendationPerformanceFromPrompt } from './ai-recommendation-performance.util.js';
import { parseExplainTourBookingRecordFromPrompt } from './ai-tour-booking-record.util.js';
import { parseExplainTourCalendarSpanFromPrompt } from './ai-tour-calendar-span.util.js';
import { parseListTourCalendarWeekFromPrompt } from './ai-tour-calendar-week.util.js';
import { parseDiagnoseTourCapacityFromPrompt } from './ai-tour-capacity.util.js';
import { parseListUpcomingTourDeparturesFromPrompt } from './ai-upcoming-tour-departures.util.js';
import {
  isApplyTourPlaybookPrompt,
  isExplainTourServicesPrompt,
  parseConfigureTourServiceFromPrompt,
} from './ai-tour-service.util.js';
import {
  parseAppGuideIntentFromPrompt,
  parseMetaProductGuideIntentFromPrompt,
} from './ai-product-guide-completion.util.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';
import type { MetaProductGuideIntent } from './ai-meta-product-guide.fixtures.js';
import type { EmptyStateGuideIntent } from './ai-product-guide-empty-state.fixtures.js';
import { EMPTY_STATE_GUIDE_RESCUE_SCENARIOS } from './ai-product-guide-empty-state.fixtures.js';
import {
  isApplyClinicPlaybookPrompt,
  isExplainClinicServicesPrompt,
  parseConfigureClinicServiceFromPrompt,
} from './ai-clinic-service.util.js';
import { validateClinicTestResultExtCommand } from './ai-clinic-test-result-ext-completion.util.js';

type Rule = (cmd: ResolvedCommand) => ValidationIssue[];

function buildAppGuideValidationIssues(
  action: AppGuideIntent,
  cmd: ResolvedCommand,
): ValidationIssue[] {
  if (parseAppGuideIntentFromPrompt(action, cmd.prompt ?? '', cmd.params)) {
    return [];
  }
  if (action === 'explain_current_screen') {
    return [
      {
        field: 'route',
        label: 'Current screen',
        message:
          'Ask what you can do on this page/screen or include session route context',
        example: 'What can I do on this page?',
      },
    ];
  }
  if (action === 'explain_app_feature') {
    return [
      {
        field: 'prompt',
        label: 'App feature',
        message:
          'Ask what a dashboard feature, menu, tab, or setting does and where to find it',
        example: 'What does the command bar do?',
      },
    ];
  }
  return [
    {
      field: 'prompt',
      label: 'Setup walkthrough',
      message:
        'Ask how to complete a dashboard setup task, or provide topicId/route for a known guide flow',
      example: 'Walk me through setting up weekly schedule templates',
    },
  ];
}

function buildMetaGuideValidationIssues(
  action: MetaProductGuideIntent,
  cmd: ResolvedCommand,
): ValidationIssue[] {
  if (
    parseMetaProductGuideIntentFromPrompt(action, cmd.prompt ?? '', cmd.params)
  ) {
    return [];
  }
  if (action === 'explain_ai_settings') {
    return [
      {
        field: 'prompt',
        label: 'AI settings',
        message:
          'Ask about AI/OpenAI settings, API key mode, confidence, or autopilot configuration',
        example: 'Where do I configure the OpenAI API key?',
      },
    ];
  }
  if (action === 'explain_ai_suggestions') {
    return [
      {
        field: 'prompt',
        label: 'AI suggestions',
        message:
          'Ask what suggestion chips/cards mean, or pass suggestionId for a specific chip',
        example: 'What do the suggestion chips on Schedule mean?',
      },
    ];
  }
  return [
    {
      field: 'prompt',
      label: 'Assistant approval',
      message:
        'Ask about the plan diff preview, Approve & execute, or swipe-to-confirm safety preview',
      example: 'What is the diff preview before I approve an AI plan?',
    },
  ];
}

function buildEmptyStateGuideValidationIssues(
  action: EmptyStateGuideIntent,
  cmd: ResolvedCommand,
): ValidationIssue[] {
  const prompt = cmd.prompt ?? '';
  if (
    EMPTY_STATE_GUIDE_RESCUE_SCENARIOS.some(
      (row) => row.intent === action && row.prompt.test(prompt),
    )
  ) {
    return [];
  }
  if (action === 'explain_visibility_block') {
    return [
      {
        field: 'prompt',
        label: 'Visibility block',
        message:
          'Ask why a dashboard menu, page, or feature is missing (role, plan, or module gate)',
        example: "Why can't I see the Integrations menu?",
      },
    ];
  }
  if (action === 'explain_empty_catalog') {
    return [
      {
        field: 'prompt',
        label: 'Empty catalog',
        message:
          'Ask why no services or providers appear (live catalog counts and public booking flag)',
        example: 'No services shown on the booking page',
      },
    ];
  }
  return [
    {
      field: 'prompt',
      label: 'Stripe Connect',
      message:
        'Ask why Stripe Connect is not set up or online card payments are unavailable',
      example: 'Stripe is not connected — how do I fix it?',
    },
  ];
}

const needs = (
  field: string,
  label: string,
  present: boolean,
  example: string,
): ValidationIssue | null =>
  present ? null : { field, label, message: `${label} is required`, example };

const ACTION_RULES: Record<string, Rule> = {
  create_booking: (cmd) => {
    const anyProvider = cmd.params.allProviders === true;
    const firstAvailable = isBookingFirstAvailable(cmd.params);
    const fallbackNames = cmd.params.providerFallbackNames;
    const hasFallbackChain =
      cmd.params.fallbackAnyProvider === true ||
      (Array.isArray(fallbackNames) && fallbackNames.length > 0) ||
      (Array.isArray(cmd.params.employeeNames) &&
        cmd.params.employeeNames.length >= 2);
    return [
      needs(
        'employeeName',
        'Service provider',
        !!(
          cmd.entities.employee ||
          cmd.enrichedParams.employeeId ||
          anyProvider ||
          firstAvailable ||
          hasFallbackChain
        ),
        'Gevorg Gasparyan or any provider',
      ),
      needs(
        'serviceName',
        'Service',
        !!(cmd.entities.service || cmd.enrichedParams.serviceId),
        'facemassage',
      ),
      needs(
        'date',
        'Date',
        hasRequiredBookingDate(cmd.params),
        '29/05/2026 or tomorrow',
      ),
      needs(
        'timeSlot',
        'Start time',
        hasRequiredBookingStartTime(cmd.params),
        '09:00 or first available',
      ),
    ].filter(Boolean) as ValidationIssue[];
  },

  create_service: (cmd) =>
    [
      needs(
        'serviceName',
        'Service name',
        !!cmd.params.serviceName,
        'facemassage',
      ),
      needs(
        'durationMinutes',
        'Duration (minutes)',
        !!cmd.params.durationMinutes,
        '60',
      ),
      needs('price', 'Price', cmd.params.price != null, '50'),
    ].filter(Boolean) as ValidationIssue[],

  update_service: (cmd) =>
    [
      needs(
        'serviceName',
        'Service name',
        !!cmd.params.serviceName,
        'Neck Massage',
      ),
      needs(
        'categoryName',
        'Service category',
        !!cmd.params.categoryName,
        'Massage',
      ),
    ].filter(Boolean) as ValidationIssue[],

  update_service_duration_buffer: (_cmd) => [] as ValidationIssue[],

  create_services: (cmd) => {
    const list = cmd.params.services;
    if (!Array.isArray(list) || list.length === 0) {
      return [
        {
          field: 'services',
          label: 'Services list',
          message:
            'Provide at least one service with name, duration, and price',
          example: 'Add services: facemassage 60min $50, haircut 30min $25',
        },
      ];
    }
    return [];
  },

  cancel_bookings: (cmd) => {
    const hasFilter =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.params.employeeName ||
      cmd.params.allProviders ||
      (cmd.params.serviceNames?.length ?? 0) > 0 ||
      !!cmd.params.serviceName;
    return hasFilter
      ? []
      : [
          {
            field: 'date',
            label: 'Filter',
            message:
              'Specify which bookings to cancel (date, provider, and/or service)',
            example: 'Cancel all facemassage appointments for Gevorg tomorrow',
          },
        ];
  },

  bulk_smart_cancel: (cmd) => ACTION_RULES.cancel_bookings(cmd),

  update_bookings: (cmd) => {
    const hasTarget =
      cmd.params.allAppointments === true ||
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.params.employeeName ||
      cmd.params.allProviders ||
      (cmd.params.employeeNames?.length ?? 0) > 0 ||
      !!cmd.params.customerName ||
      !!cmd.params.timeSlot ||
      !!cmd.params.timeFrom;
    const hasChange = !!cmd.params.status || !!cmd.params.paymentStatus;
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'date',
              label: 'Appointments',
              message:
                'Specify which appointment(s) to update (date, provider, time, or all)',
              example:
                'Mark all Gevorg appointments on 01/06/2026 as done and paid',
            },
          ]),
      ...(hasChange
        ? []
        : [
            {
              field: 'status',
              label: 'Update',
              message: 'Specify status and/or payment to apply',
              example:
                'Mark appointments from 16:00–17:15 as done with payment N/A',
            },
          ]),
    ];
  },

  hide_appointments_from_calendar: (cmd) => {
    const hasFilter =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.params.employeeName ||
      cmd.params.allProviders ||
      (cmd.params.serviceNames?.length ?? 0) > 0 ||
      !!cmd.params.serviceName ||
      !!cmd.params.statusFilter ||
      (cmd.params.statusFilters?.length ?? 0) > 0 ||
      !!cmd.params.timeSlot ||
      !!cmd.params.customerName;
    return hasFilter
      ? []
      : [
          {
            field: 'date',
            label: 'Filter',
            message:
              'Specify which appointments to hide (date, provider, status, and/or service)',
            example:
              'Hide all cancelled appointments for Gevorg today from the calendar',
          },
        ];
  },

  unhide_appointments_from_calendar: (cmd) => {
    const hasFilter =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.params.employeeName ||
      cmd.params.allProviders ||
      (cmd.params.serviceNames?.length ?? 0) > 0 ||
      !!cmd.params.serviceName ||
      !!cmd.params.statusFilter ||
      (cmd.params.statusFilters?.length ?? 0) > 0 ||
      !!cmd.params.timeSlot ||
      !!cmd.params.customerName;
    return hasFilter
      ? []
      : [
          {
            field: 'date',
            label: 'Filter',
            message:
              'Specify which hidden appointments to restore (date, provider, status, and/or service)',
            example:
              'Unhide all hidden cancelled appointments for Gevorg today on the calendar',
          },
        ];
  },

  fill_slot_from_waitlist: (cmd) => {
    const hasWhen = !!cmd.params.date || !!cmd.params.timeSlot;
    return hasWhen
      ? []
      : [
          {
            field: 'timeSlot',
            label: 'Slot time',
            message: 'Specify which cancelled slot to fill (date and time)',
            example: 'Fill cancelled 14:00 slot tomorrow from waitlist',
          },
        ];
  },

  reschedule_booking: (cmd) => {
    const hasTarget =
      !!cmd.params.bookingId ||
      !!cmd.params.customerName ||
      !!cmd.params.employeeName;
    const hasNewTime = hasRescheduleNewTime(cmd.params);
    const hasServiceChange = !!(
      cmd.entities.service || cmd.enrichedParams.serviceId
    );
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'bookingId',
              label: 'Booking',
              message:
                'Specify which appointment to update (customer, provider, or booking ID)',
              example: "Move Mary's appointment to tomorrow from 13:30",
            },
          ]),
      ...(hasNewTime || hasServiceChange
        ? []
        : [
            {
              field: 'timeSlot',
              label: 'New time or service',
              message: 'Specify a new service type and/or a new date/time',
              example: 'Change service to facemassage or move to 16:00',
            },
          ]),
    ];
  },

  check_availability: (cmd) =>
    [
      needs(
        'date',
        'Date',
        hasAvailabilityWhen(cmd.params),
        'tomorrow or 29/05/2026',
      ),
    ].filter(Boolean) as ValidationIssue[],

  show_appointments: (cmd) =>
    [needs('date', 'Date', !!cmd.params.date, 'tomorrow or 29/05/2026')].filter(
      Boolean,
    ) as ValidationIssue[],

  list_bookings: (cmd) =>
    [needs('date', 'Date', !!cmd.params.date, 'tomorrow or 29/05/2026')].filter(
      Boolean,
    ) as ValidationIssue[],

  summarize_day: (cmd) =>
    [needs('date', 'Date', !!cmd.params.date, 'today or 29/05/2026')].filter(
      Boolean,
    ) as ValidationIssue[],

  fill_unused_slots: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      (cmd.params.employeeNames?.length ?? 0) > 0 ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message: 'Specify provider(s) or say "all providers"',
              example: 'Fill gaps for Gevorg between 9-19',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'Date or range',
              message: 'Specify when to fill gaps',
              example: 'this week or 29/05/2026',
            },
          ]),
    ];
  },

  list_schedule_gaps: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      (cmd.params.employeeNames?.length ?? 0) > 0 ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message: 'Specify who to list gaps for',
              example: 'Which days does Gevorg have gaps this week?',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'dateFrom',
              label: 'Date range',
              message: 'Specify which week or date range to check',
              example: 'this week or 28/05/2026 to 03/06/2026',
            },
          ]),
    ];
  },

  apply_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.dateFrom || !!cmd.params.date || !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message: 'Specify who to apply the template to',
              example: 'Apply weekday template to Gevorg this week',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'dateFrom',
              label: 'Date range',
              message: 'Specify when to apply the schedule',
              example: 'this week or 01/06/2026 to 07/06/2026',
            },
          ]),
      ...(cmd.entities.template || cmd.params.templateName
        ? []
        : [
            {
              field: 'templateName',
              label: 'Schedule template',
              message:
                'No schedule template found — create one in Schedule → Templates first',
            },
          ]),
    ];
  },

  swap_schedules: (cmd) => {
    const names = cmd.params.employeeNames as string[] | undefined;
    const hasPair =
      (cmd.params.employeeName && cmd.params.swapWithEmployeeName) ||
      (names?.length ?? 0) >= 2 ||
      cmd.entities.employees.length >= 2;
    const hasWhen =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    return [
      ...(hasPair
        ? []
        : [
            {
              field: 'employeeNames',
              label: 'Providers to swap',
              message: 'Specify two providers whose schedules to swap',
              example: 'Swap Friday schedules between Gevorg and Maria',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'When to swap',
              message: 'Specify the day or date range to swap',
              example: 'Friday or 05/06/2026',
            },
          ]),
    ];
  },

  rebalance_capacity: (cmd) => {
    const hasService =
      !!cmd.params.serviceName || cmd.entities.services.length > 0;
    const hasWhen = !!cmd.params.date || !!cmd.entities.dateRange;
    const hasPair =
      (cmd.params.fromEmployeeName && cmd.params.toEmployeeName) ||
      (cmd.params.employeeNames?.length ?? 0) >= 2 ||
      cmd.entities.employees.length >= 2;
    return [
      ...(hasPair
        ? []
        : [
            {
              field: 'fromEmployeeName',
              label: 'Source and target providers',
              message: 'Specify who to move slots from and to',
              example: 'from Gevorg to Maria',
            },
          ]),
      ...(hasService
        ? []
        : [
            {
              field: 'serviceName',
              label: 'Service',
              message: 'Specify which service slots to move',
              example: 'facemassage',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'Date',
              message: 'Specify which day to rebalance',
              example: 'Friday',
            },
          ]),
    ];
  },

  holiday_mode: (cmd) => {
    const hasClose =
      (Array.isArray(cmd.params.closeDates) &&
        cmd.params.closeDates.length > 0) ||
      (Array.isArray(cmd.params.holidayDates) &&
        cmd.params.holidayDates.length > 0) ||
      !!cmd.params.dateFrom;
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    return [
      ...(hasClose
        ? []
        : [
            {
              field: 'closeDates',
              label: 'Closure dates',
              message: 'Specify which days to close',
              example: 'Dec 24–26',
            },
          ]),
      ...(hasProviders
        ? []
        : [
            {
              field: 'allProviders',
              label: 'Who to close',
              message: 'Specify all providers or named staff',
              example: 'Close for all providers',
            },
          ]),
    ];
  },

  onboard_provider_schedule: (cmd) => {
    const hasProvider =
      !!cmd.params.employeeName || cmd.entities.employees.length === 1;
    const hasRange =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    const hasTemplate = !!cmd.params.templateName || !!cmd.entities.template;
    return [
      ...(hasProvider
        ? []
        : [
            {
              field: 'employeeName',
              label: 'New provider',
              message: 'Specify the provider to onboard',
              example: 'Anna',
            },
          ]),
      ...(hasRange
        ? []
        : [
            {
              field: 'dateFrom',
              label: 'First week',
              message: 'Specify the first week date range',
              example: 'next week',
            },
          ]),
      ...(hasTemplate
        ? []
        : [
            {
              field: 'templateName',
              label: 'Schedule template',
              message: 'Specify which weekday template to apply',
              example: 'Weekday template',
            },
          ]),
    ];
  },

  block_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.entities.dateRange ||
      cmd.params.blockFullDay;
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message: 'Specify who to block time for',
              example: 'Block lunch 12-13 for all providers Mon-Fri',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'When to block',
              message: 'Specify date or range to block',
              example: 'May 30 or this week Mon-Fri',
            },
          ]),
    ];
  },

  create_direct_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      !!cmd.entities.employee ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    const hasPeriods =
      (Array.isArray(cmd.params.periods) && cmd.params.periods.length > 0) ||
      /\d{1,2}\s*[-–]\s*\d{1,2}/.test(cmd.prompt ?? '');
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message:
                'Specify who to schedule (one provider or all employees)',
              example: 'All employees this week, or Gevorg Gasparyan tomorrow',
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'Date',
              message: 'Specify when to apply the schedule',
              example: 'Friday, this week, tomorrow, or June 2-June 10',
            },
          ]),
      ...(hasPeriods
        ? []
        : [
            {
              field: 'periods',
              label: 'Schedule periods',
              message: 'Describe working hours and breaks',
              example: '9-19 with lunch 12-13 unavailable',
            },
          ]),
    ];
  },

  clear_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date || !!cmd.params.dateFrom || !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [
            {
              field: 'employeeName',
              label: 'Service provider',
              message: 'Specify whose schedule to clear',
              example: "Cleanup Mary's schedule on 31/05/2026",
            },
          ]),
      ...(hasWhen
        ? []
        : [
            {
              field: 'date',
              label: 'Date',
              message: 'Specify which day to clear',
              example: '31/05/2026 or tomorrow',
            },
          ]),
    ];
  },

  assign_employee_services: (cmd) =>
    [
      needs(
        'employeeName',
        'Service provider',
        !!cmd.entities.employee,
        'Gevorg Gasparyan',
      ),
      ...(cmd.entities.services.length > 0 ||
      cmd.params.serviceName ||
      cmd.params.categoryName ||
      cmd.params.assignFromCategory
        ? []
        : [
            {
              field: 'serviceName',
              label: 'Service(s) or category',
              message: 'Specify which service(s) or service category to assign',
              example: 'Assign all services from Color category to Gevorg',
            },
          ]),
    ].filter(Boolean) as ValidationIssue[],

  unassign_employee_services: (cmd) =>
    [
      needs(
        'employeeName',
        'Service provider',
        !!cmd.entities.employee,
        'Gevorg Gasparyan',
      ),
      ...(cmd.entities.services.length > 0 ||
      cmd.params.serviceName ||
      cmd.params.categoryName ||
      cmd.params.unassignFromCategory ||
      cmd.params.unassignAllServices
        ? []
        : [
            {
              field: 'serviceName',
              label: 'Service(s), category, or all',
              message:
                'Specify which assigned service(s), category, or all services to remove',
              example: 'Remove all Color services from Gevorg',
            },
          ]),
    ].filter(Boolean) as ValidationIssue[],

  transfer_employee_services: (cmd) =>
    [
      needs(
        'fromEmployeeName',
        'Source provider',
        !!cmd.params.fromEmployeeName || !!cmd.entities.employee,
        'Maria Lopez',
      ),
      needs(
        'toEmployeeName',
        'Target provider',
        !!cmd.params.toEmployeeName,
        'Anna Smith',
      ),
      ...(cmd.entities.services.length > 0 ||
      cmd.params.serviceName ||
      cmd.params.categoryName ||
      cmd.params.transferFromCategory ||
      cmd.params.unassignAllServices
        ? []
        : [
            {
              field: 'serviceName',
              label: 'Service(s), category, or all',
              message:
                'Specify which assigned service(s), category, or all services to move',
              example: 'Move all Massage services from Maria to Anna',
            },
          ]),
    ].filter(Boolean) as ValidationIssue[],

  create_schedule_template: (cmd) =>
    [
      needs(
        'templateName',
        'Template name',
        !!(cmd.params.templateName || cmd.params.name),
        'Weekday hours',
      ),
      needs(
        'periods',
        'Schedule hours',
        !!(
          cmd.params.periods?.length ||
          cmd.params.timeFrom ||
          cmd.params.timeTo ||
          cmd.params.timeSlot
        ),
        '9:00-17:00 with lunch break or explicit periods',
      ),
    ].filter(Boolean) as ValidationIssue[],

  mark_no_shows: (cmd) =>
    [
      needs(
        'date',
        'Date',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'today or yesterday',
      ),
    ].filter(Boolean) as ValidationIssue[],

  payment_sweep: (_cmd) => [] as ValidationIssue[],

  day_replan: (cmd) =>
    [
      needs(
        'date',
        'Date',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'today or tomorrow',
      ),
    ].filter(Boolean) as ValidationIssue[],

  no_show_recovery: (cmd) =>
    [
      needs(
        'date',
        'Date',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'today or yesterday',
      ),
    ].filter(Boolean) as ValidationIssue[],

  sick_day_replan: (cmd) =>
    [
      needs('employeeName', 'Provider', !!cmd.params.employeeName, 'Maria'),
      needs(
        'date',
        'Date',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'today',
      ),
    ].filter(Boolean) as ValidationIssue[],

  import_services_from_menu: (cmd) =>
    [
      needs(
        'menuText',
        'Menu text',
        !!(
          cmd.params.menuText ||
          cmd.params.ocrText ||
          (Array.isArray(cmd.params.services) && cmd.params.services.length > 0)
        ),
        'Facial 60min $50, Haircut 30min $25',
      ),
    ].filter(Boolean) as ValidationIssue[],

  update_service_prices: (cmd) =>
    [
      needs(
        'percentChange',
        'Percent or dollar amount change',
        !!(
          cmd.params.percentChange ||
          cmd.params.priceChangePercent ||
          cmd.params.amountChange ||
          cmd.params.priceChangeAmount ||
          cmd.params.absoluteChange ||
          cmd.params.priceDelta
        ),
        '10% or 5 dollars',
      ),
    ].filter(Boolean) as ValidationIssue[],

  staff_service_matrix: (_cmd) => [] as ValidationIssue[],

  create_employee: (cmd) =>
    [
      needs(
        'employeeName',
        'Team member name',
        !!cmd.params.employeeName,
        'Anna',
      ),
    ].filter(Boolean) as ValidationIssue[],

  update_employee: (cmd) =>
    [
      needs(
        'employeeName',
        'Team member name',
        !!cmd.params.employeeName,
        'Anna',
      ),
    ].filter(Boolean) as ValidationIssue[],

  invite_staff_member: (cmd) =>
    [
      needs(
        'email',
        'Email or employee name',
        !!(cmd.params.email || cmd.params.employeeName),
        'anna@salon.com or Maria',
      ),
    ].filter(Boolean) as ValidationIssue[],

  deactivate_employee: (cmd) =>
    [
      needs(
        'employeeName',
        'Team member name',
        !!cmd.params.employeeName,
        'Gevorg',
      ),
    ].filter(Boolean) as ValidationIssue[],

  configure_online_booking: (_cmd) => [] as ValidationIssue[],

  open_billing_settings: (_cmd) => [] as ValidationIssue[],

  configure_stripe_connect: (_cmd) => [] as ValidationIssue[],

  configure_checkout_defaults: (_cmd) => [] as ValidationIssue[],

  configure_notification_settings: (cmd) => {
    const parsed = parseConfigureNotificationSettingsFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    if (!parsed) {
      return [
        {
          field: 'emailEnabled',
          label: 'Notification settings',
          message:
            'Specify channel or reminder toggles (email, SMS, WhatsApp, 24h/1h reminders)',
          example:
            'Configure notification settings — enable email and WhatsApp, disable SMS',
        },
      ];
    }
    return [] as ValidationIssue[];
  },

  configure_whatsapp_integration: (cmd) => {
    const parsed = parseConfigureWhatsappIntegrationFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    if (parsed === null) {
      return [
        {
          field: 'usePlatformDefault',
          label: 'WhatsApp integration',
          message:
            'Specify connection mode, template names, or Meta credentials for WhatsApp',
          example: 'Configure WhatsApp integration for the salon',
        },
      ];
    }
    return [] as ValidationIssue[];
  },

  configure_openai_integration: (cmd) => {
    const parsed = parseConfigureOpenaiIntegrationFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    if (parsed === null) {
      return [
        {
          field: 'usePlatformDefault',
          label: 'OpenAI integration',
          message: 'Specify platform default or tenant OpenAI API key (sk-…)',
          example: 'Configure OpenAI integration for the salon',
        },
      ];
    }
    return [] as ValidationIssue[];
  },

  configure_service_deposit_policy: (cmd) => {
    const parsed = parseServiceDepositPolicyConfig(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed) {
      issues.push({
        field: 'depositPercent',
        label: 'Deposit',
        message: 'Specify deposit percentage or fixed dollar amount',
        example: 'Set 30% deposit on premium tier services',
      });
    }
    if (
      parsed &&
      !parsed.allServices &&
      !parsed.serviceName &&
      !parsed.serviceNames?.length &&
      !parsed.categoryName &&
      !parsed.serviceTier &&
      !parsed.featuredOnly
    ) {
      issues.push({
        field: 'serviceTier',
        label: 'Scope',
        message:
          'Specify tier, featured, category, named services, or all services',
        example: 'Require $25 deposit on featured services',
      });
    }
    return issues;
  },

  configure_service_featured: (cmd) => {
    const parsed = parseConfigureServiceFeaturedFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed) {
      issues.push({
        field: 'isFeatured',
        label: 'Featured metadata',
        message: 'Specify featured flag or service tier to update',
        example: 'Mark Haircut as featured',
      });
      return issues;
    }
    if (parsed.isFeatured == null && parsed.serviceTier == null) {
      issues.push({
        field: 'isFeatured',
        label: 'Featured metadata',
        message: 'Specify featured flag or service tier to update',
        example: 'Set Blowdry to premium tier',
      });
    }
    if (
      !parsed.serviceName &&
      !parsed.serviceNames?.length &&
      !parsed.categoryName &&
      !parsed.allServices
    ) {
      issues.push({
        field: 'serviceName',
        label: 'Service scope',
        message: 'Specify which service or category to update',
        example: 'Mark Haircut as featured',
      });
    }
    return issues;
  },

  bulk_assign_services_category: (cmd) => {
    const parsed = parseBulkAssignServicesCategoryFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed?.targetCategoryName) {
      issues.push({
        field: 'targetCategoryName',
        label: 'Target category',
        message: 'Specify which category to move services into',
        example: 'Move all hair services under Hair category',
      });
    }
    if (
      parsed &&
      !parsed.allServices &&
      !parsed.serviceNames?.length &&
      !parsed.sourceCategoryName &&
      !parsed.sourceCategoryHint
    ) {
      issues.push({
        field: 'sourceCategoryHint',
        label: 'Service scope',
        message: 'Specify which services to move (all, category, or names)',
        example: 'Move all hair services under Hair category',
      });
    }
    return issues;
  },

  configure_package_online_payment: (cmd) => {
    const parsed = parseConfigurePackageOnlinePaymentFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed?.prepaymentMode) {
      issues.push({
        field: 'prepaymentMode',
        label: 'Prepayment mode',
        message: 'Specify prepayment mode (full, deposit, or disable)',
        example: 'Require 50% online prepayment for Spa Day package',
      });
    }
    if (
      parsed &&
      !parsed.allPackages &&
      !parsed.packageName &&
      !parsed.packageNames?.length
    ) {
      issues.push({
        field: 'packageName',
        label: 'Package scope',
        message: 'Specify which package or packages to update',
        example: 'Enable full online payment for Bridal package',
      });
    }
    return issues;
  },

  summarize_loyalty_program: (_cmd) => [] as ValidationIssue[],

  list_waitlist_entries: (_cmd) => [] as ValidationIssue[],

  offer_waitlist_slot: (cmd) =>
    [
      needs(
        'employeeName',
        'Provider name',
        !!cmd.params.employeeName,
        'Maria',
      ),
      needs('date', 'Date', !!cmd.params.date, 'Friday'),
      needs('timeSlot', 'Time', !!cmd.params.timeSlot, '14:00'),
    ].filter(Boolean) as ValidationIssue[],

  check_schedule_compliance: (cmd) =>
    [
      needs(
        'date',
        'Date range',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'this month',
      ),
    ].filter(Boolean) as ValidationIssue[],

  revenue_forecast: (cmd) =>
    [
      needs(
        'date',
        'Date range',
        !!(cmd.params.date || (cmd.params.dateFrom && cmd.params.dateTo)),
        'next week',
      ),
    ].filter(Boolean) as ValidationIssue[],

  configure_business_currency: (cmd) =>
    parseCurrencyFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'currencyCode',
            label: 'Currency',
            message: 'Specify which ISO currency to use',
            example: 'Set default currency to AMD',
          },
        ],

  configure_business_tax: (cmd) =>
    parseBusinessTaxFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'rate',
            label: 'Tax settings',
            message: 'Specify tax rate, model, or enable/disable',
            example: 'Enable 20% VAT',
          },
        ],

  configure_privacy_retention: (cmd) =>
    parseConfigurePrivacyRetentionFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'retention',
            label: 'Privacy retention',
            message: 'Specify retention period or cookie banner change',
            example: 'Keep customer data for 3 years',
          },
        ],

  configure_granular_consent: (cmd) =>
    parseConfigureGranularConsentFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'granularConsent',
            label: 'Granular consent',
            message:
              'Specify AI processing or third-party integration consent toggle',
            example: 'Require AI processing consent at checkout',
          },
        ],

  enable_hipaa_mode: (cmd) =>
    parseEnableHipaaModeFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'hipaa',
            label: 'HIPAA mode',
            message: 'Specify HIPAA enable/disable or session timeout',
            example: 'Enable HIPAA safeguards',
          },
        ],

  explain_compliance_status: (cmd) =>
    parseExplainComplianceStatusFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Compliance status',
            message:
              'Ask about compliance overview, HIPAA/BAA status, or retention periods',
            example: 'What is our compliance status?',
          },
        ],

  list_sub_processors: (cmd) =>
    parseListSubProcessorsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'processors',
            label: 'Sub-processors',
            message:
              'Ask who your data sub-processors are or to show the Article 28 processor list',
            example: 'Who are our data sub-processors?',
          },
        ],

  explain_gdpr_checklist: (cmd) =>
    parseExplainGdprChecklistFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'GDPR checklist',
            message:
              'Ask whether you are GDPR compliant or what privacy items are missing',
            example: 'Are we GDPR compliant?',
          },
        ],

  admin_delete_customer_data: (cmd) => {
    const parsed = parseAdminDeleteCustomerDataFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const customerName =
      parsed?.customerName ??
      (typeof cmd.params.customerName === 'string'
        ? cmd.params.customerName.trim()
        : '');
    return parsed && customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Customer to forget',
            message: 'Specify which customer to anonymize',
            example: 'Forget this customer Anna',
          },
        ];
  },

  report_data_breach: (cmd) =>
    parseReportDataBreachFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'description',
            label: 'Breach description',
            message:
              'Describe the data breach or security incident (at least 10 characters)',
            example:
              'Report a data breach: unauthorized access to customer emails',
          },
        ],

  send_breach_notification: (cmd) =>
    parseSendBreachNotificationFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'incidentRef',
            label: 'Breach incident',
            message:
              'Specify which breach incident to notify (BR-42, incident X, or UUID prefix)',
            example: 'Email affected customers about breach BR-42',
          },
        ],

  list_breach_incidents: (cmd) =>
    parseListBreachIncidentsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Breach incidents',
            message: 'Ask to show breach incidents or GDPR 72-hour deadlines',
            example: 'Show breach incidents',
          },
        ],

  open_compliance_dashboard: (cmd) =>
    parseOpenComplianceDashboardFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'panel',
            label: 'Compliance panel',
            message:
              'Ask to open compliance settings or a compliance panel (breach log, HIPAA, PHI audit)',
            example: 'Open compliance settings',
          },
        ],

  view_phi_access_audit: (cmd) =>
    parseViewPhiAccessAuditFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'audit',
            label: 'PHI access audit',
            message:
              'Ask who accessed patient notes or to show the HIPAA PHI audit log',
            example: 'Who accessed patient notes?',
          },
        ],

  explain_phi_encryption_status: (cmd) =>
    parseExplainPhiEncryptionStatusFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'encryption',
            label: 'PHI encryption',
            message:
              'Ask whether HIPAA PHI encryption is on or if fields are encrypted at rest',
            example: 'Is HIPAA encryption on?',
          },
        ],

  explain_minimum_necessary_phi_access: (cmd) =>
    parseExplainMinimumNecessaryPhiAccessFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    )
      ? []
      : [
          {
            field: 'aspect',
            label: 'Minimum necessary PHI access',
            message:
              'Ask who can see patient notes or what PHI staff can access',
            example: 'Who can see patient notes?',
          },
        ],

  explain_hipaa_session_timeout: (cmd) =>
    parseExplainHipaaSessionTimeoutFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'timeout',
            label: 'HIPAA session timeout',
            message:
              'Ask when you will be logged out or what the HIPAA session timeout is',
            example: 'When will I be logged out?',
          },
        ],

  configure_hipaa_session_timeout: (cmd) =>
    parseConfigureHipaaSessionTimeoutFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'sessionTimeoutMinutes',
            label: 'HIPAA session timeout',
            message: 'Specify a HIPAA session timeout in minutes (5–60)',
            example: 'Set HIPAA timeout to 10 minutes',
          },
        ],

  accept_hipaa_baa: (cmd) =>
    parseAcceptHipaaBaaFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'baa',
            label: 'HIPAA BAA',
            message:
              'Ask to accept or sign the HIPAA Business Associate Agreement',
            example: 'Accept the HIPAA business associate agreement',
          },
        ],

  explain_data_rights: (cmd) =>
    parseExplainDataRightsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Data rights',
            message:
              'Ask how to export or delete your data, or about the cookie banner',
            example: 'How can I export my personal data?',
          },
        ],

  privacy_export: (cmd) =>
    isPrivacyExportCustomerPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: '_prompt',
            label: 'Privacy export',
            message: 'Ask to export or download your personal data',
            example: 'Export my personal data',
          },
        ],

  privacy_delete: (cmd) =>
    isPrivacyDeleteCustomerPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: '_prompt',
            label: 'Privacy delete',
            message: 'Ask to delete or erase your account data',
            example: 'Delete my account',
          },
        ],

  set_service_tax_rate: (cmd) =>
    parseSetServiceTaxRateFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'serviceQuery',
            label: 'Service tax override',
            message: 'Specify which services and tax rate to apply',
            example: 'Make massage services tax-exempt',
          },
        ],

  configure_stacked_tax_rules: (cmd) =>
    parseConfigureStackedTaxRulesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'rules',
            label: 'Stacked tax rules',
            message: 'Specify rules to add/stack or a rule name to remove',
            example: 'Add 5% GST and 8% PST',
          },
        ],

  link_recommended_products: (cmd) => {
    const parsed = parseLinkRecommendedProductsFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed?.productNames.length && !parsed?.productIds?.length) {
      issues.push({
        field: 'productNames',
        label: 'Products',
        message: 'Specify which products to recommend',
        example: 'Recommend shampoo and conditioner after haircut service',
      });
    }
    if (
      !parsed?.serviceName &&
      !parsed?.serviceId &&
      !parsed?.categoryName &&
      !parsed?.categoryId
    ) {
      issues.push({
        field: 'serviceName',
        label: 'Service',
        message: 'Specify which service or category should show these products',
        example: 'Recommend shampoo after haircut service',
      });
    }
    return issues;
  },

  configure_service_online_payment: (cmd) => {
    const parsed = parseServiceOnlinePaymentConfig(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed?.prepaymentMode) {
      issues.push({
        field: 'prepaymentMode',
        label: 'Prepayment',
        message:
          'Specify full prepayment, deposit percentage, or disable online payment',
        example:
          'Accept online payment on public booking for all services with 50% prepayment',
      });
    }
    if (
      parsed &&
      !parsed.allServices &&
      !parsed.serviceName &&
      !parsed.serviceNames?.length &&
      !parsed.categoryName
    ) {
      issues.push({
        field: 'serviceName',
        label: 'Services',
        message:
          'Specify all services, a category, or named services for online payment',
        example:
          'Accept online payment on public booking for Massage with full prepayment',
      });
    }
    return issues;
  },

  configure_recommendation_product: (cmd) => {
    const parsed = parseConfigureRecommendationProductFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    );
    const issues: ValidationIssue[] = [];
    if (!parsed?.productName && !parsed?.productId) {
      issues.push({
        field: 'productName',
        label: 'Product',
        message: 'Specify the recommendation product name',
        example: 'Add a shampoo product for post-checkout with image and link',
      });
    }
    if (parsed?.wantsImage && !parsed.imageUrl) {
      issues.push({
        field: 'imageUrl',
        label: 'Image',
        message: 'Provide an image URL for the recommendation product',
        example:
          'Add shampoo for post-checkout with image https://cdn.test/shampoo.jpg',
      });
    }
    if (parsed?.wantsLink && !parsed.externalLink) {
      issues.push({
        field: 'externalLink',
        label: 'Link',
        message: 'Provide an external shop link for the recommendation product',
        example:
          'Add shampoo for post-checkout with link https://shop.test/shampoo',
      });
    }
    return issues;
  },

  configure_business_languages: (cmd) =>
    parseBusinessLanguagesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'locales',
            label: 'Languages',
            message:
              'Specify which languages to enable, disable, or set as default',
            example: 'Enable Armenian and Russian',
          },
        ],

  configure_business_date_format: (cmd) =>
    parseBusinessDateFormatFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'dateFormat',
            label: 'Date/time format',
            message: 'Specify a date or time format to use',
            example: 'Use US date format',
          },
        ],

  configure_package_localized_names: (cmd) =>
    parsePackageLocalizedNamesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'packageName',
            label: 'Package',
            message:
              'Specify the package and locale display name to set or clear',
            example: 'Add Armenian name «Սպա օր» for Spa Day package',
          },
        ],

  configure_tour_service: (cmd) =>
    parseConfigureTourServiceFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'serviceName',
            label: 'Service',
            message:
              'Specify the service and tour settings to update (group size, difficulty, etc.)',
            example: 'Mark City Tour as a tour with max 12 people',
          },
        ],

  explain_tour_services: (cmd) =>
    isExplainTourServicesPrompt(cmd.prompt ?? '') ? [] : [],

  explain_tour_booking_record: (cmd) =>
    parseExplainTourBookingRecordFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour booking record',
            message:
              'Ask about one tour booking record (pax, tour dates, special requirements, or calendar span)',
            example:
              'Explain tour booking record for booking bk-tour-1 — pax and dates',
          },
        ],

  explain_tour_calendar_span: (cmd) =>
    parseExplainTourCalendarSpanFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour calendar span',
            message:
              'Ask how the provider calendar renders tour spans (colors, clipping, stacked lanes)',
            example:
              'Why do tours appear across multiple days on the provider calendar?',
          },
        ],

  list_tour_calendar_week: (cmd) =>
    parseListTourCalendarWeekFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour calendar week',
            message:
              'Ask to list tour departures on the provider calendar week',
            example: 'List tour departures on the provider calendar this week',
          },
        ],

  list_upcoming_tour_departures: (cmd) =>
    parseListUpcomingTourDeparturesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Upcoming tour departures',
            message:
              'Ask to list upcoming tour departures with pax and remaining capacity',
            example:
              'List upcoming tour departures with pax and remaining capacity',
          },
        ],

  apply_tour_playbook: (cmd) =>
    isApplyTourPlaybookPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour playbook',
            message:
              'Ask to apply the tour vertical playbook (catalog + 08:00–18:00 schedule)',
            example: 'Apply tour playbook',
          },
        ],

  configure_clinic_service: (cmd) =>
    parseConfigureClinicServiceFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'serviceName',
            label: 'Service',
            message:
              'Specify the service and clinic settings to update (service type, fasting, prep instructions)',
            example: 'Mark CBC as a lab test requiring fasting',
          },
        ],

  explain_clinic_services: (cmd) =>
    isExplainClinicServicesPrompt(cmd.prompt ?? '') ? [] : [],

  apply_clinic_playbook: (cmd) =>
    isApplyClinicPlaybookPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Clinic playbook',
            message:
              'Ask to apply the clinic vertical playbook (catalog + clinic operating hours schedule)',
            example: 'Apply clinic playbook',
          },
        ],

  explain_package_display_name: (cmd) =>
    parsePackageDisplayNameExplainFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'packageName',
            label: 'Package',
            message: 'Specify which package to explain for the visitor locale',
            example:
              'What Armenian name shows for Spa Day package on public booking?',
          },
        ],

  explain_tour_booking: (cmd) =>
    parseExplainTourBookingFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'serviceName',
            label: 'Tour service',
            message:
              'Specify which tour to explain (group size, per-person price, or duration)',
            example:
              'What is the max group size for City Tour on this booking page?',
          },
        ],

  explain_tour_meeting_point: (cmd) =>
    parseExplainTourMeetingPointFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour meeting point',
            message:
              'Ask about a tour meeting point or arrival time (e.g. "Where do we meet for my tour?")',
            example: 'Where do we meet for my tour?',
          },
        ],

  explain_any_provider_option: (cmd) =>
    parseExplainAnyProviderOptionFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Any provider option',
            message:
              'Ask what Any stylist means or whether someone will be assigned',
            example: 'What does Any stylist mean?',
          },
        ],

  pick_provider_for_service: (cmd) =>
    parsePickProviderForServiceFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Pick provider',
            message:
              'Name a stylist to book with or ask to use your usual stylist',
            example: 'Book with Anna for color',
          },
        ],

  switch_provider_same_time: (cmd) =>
    parseSwitchProviderSameTimeFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Switch provider same time',
            message: 'Ask to keep the same time but switch stylist',
            example: 'Keep 3pm but different stylist',
          },
        ],

  explain_professional_profile: (cmd) =>
    parseExplainProfessionalProfileFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Professional profile',
            message: 'Ask to show a stylist profile or browse the team',
            example: "Show me Anna's services",
          },
        ],

  explain_provider_availability: (cmd) =>
    parseExplainProviderAvailabilityFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Provider availability',
            message: 'Ask if a stylist is working on a day or who has openings',
            example: 'Is Marco working Saturday?',
          },
        ],

  explain_clinic_booking: (cmd) =>
    parseExplainClinicBookingFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Clinic checkout field',
            message:
              'Ask about symptoms, referral notes, lab prep/fasting, or pre-visit intake on checkout',
            example: 'What should I put in the symptoms field on checkout?',
          },
        ],

  explain_lab_prep: (cmd) =>
    parseExplainLabPrepFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'serviceName',
            label: 'Lab test',
            message:
              'Ask whether a lab test requires fasting or what preparation applies',
            example: 'Do I need to fast for blood work?',
          },
        ],

  explain_clinic_booking_fields: (cmd) =>
    parseExplainClinicBookingFieldsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Clinic booking field',
            message: 'Ask why a clinic booking or intake field is collected',
            example: 'Why do you ask for my ID?',
          },
        ],

  explain_public_intake_form: (cmd) =>
    parseExplainPublicIntakeFormFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Pre-visit intake questionnaire',
            message:
              'Ask about the optional pre-visit health questionnaire before lab booking',
            example: 'Why these health questions?',
          },
        ],

  explain_guest_checkout_fields: (cmd) =>
    parseExplainGuestCheckoutFieldsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Guest checkout field',
            message:
              'Ask why name/email/phone are required, guest vs account checkout, or contact merge rules',
            example: 'Why do you need my email at checkout?',
          },
        ],

  explain_why_sign_in: (cmd) =>
    parseExplainWhySignInFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Sign-in benefits',
            message:
              'Ask whether you need an account, what signing in gives you, or how guest checkout compares',
            example: "What's the benefit of signing in?",
          },
        ],

  sign_in_to_manage_booking: (cmd) =>
    parseSignInToManageBookingFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Manage-page sign-in',
            message:
              'Ask why the manage page wants you to sign in or how to manage after an invalid link',
            example: 'Sign in to change my appointment',
          },
        ],

  explain_manage_booking_page: (cmd) =>
    parseExplainManageBookingPageFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Manage booking page',
            message:
              'Ask what you can do on the manage page or why a manage link is invalid',
            example: 'What can I do on this manage page?',
          },
        ],

  recover_lost_manage_link: (cmd) =>
    parseRecoverLostManageLinkFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Recover manage link',
            message:
              'Say you lost your confirmation email or give the email or phone used when booking',
            example: 'I lost my booking confirmation email',
          },
        ],

  find_my_saved_salons: (cmd) =>
    parseFindMySavedSalonsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Saved salons',
            message: 'Ask to show your saved or recently visited salons',
            example: 'Show my saved salons',
          },
        ],

  switch_salon_tenant: (cmd) =>
    parseSwitchSalonTenantFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'salonName',
            label: 'Switch salon',
            message: 'Name the salon you want to switch to',
            example: 'Go back to Glow Nails',
          },
        ],

  fix_checkout_validation_error: (cmd) =>
    parseFixCheckoutValidationErrorFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Checkout validation error',
            message:
              'Describe the checkout validation error you see (e.g. email filled but still required)',
            example:
              'It says enter email but I already filled it in at checkout',
          },
        ],

  confirm_my_booking_details: (cmd) =>
    parseConfirmMyBookingDetailsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Booking details',
            message:
              'Ask about your appointment time, service, provider, or booking summary',
            example: 'What time is my appointment?',
          },
        ],

  add_booking_to_calendar: (cmd) =>
    parseAddBookingToCalendarFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'format',
            label: 'Calendar format',
            message:
              'Ask to add your booking to calendar or download an ICS file',
            example: 'Add to my calendar',
          },
        ],

  get_directions_to_salon: (cmd) =>
    parseGetDirectionsToSalonFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Salon directions',
            message:
              'Ask for directions to the salon or where to park for your visit',
            example: 'Directions to the salon',
          },
        ],

  explain_preparation_notes: (cmd) =>
    parseExplainPreparationNotesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'aspect',
            label: 'Visit preparation',
            message:
              'Ask about fasting, what to bring, or meeting point for your appointment',
            example: 'Do I need to fast?',
          },
        ],

  book_another_service: (cmd) =>
    parseBookAnotherServiceFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Book another service',
            message: 'Ask to start a fresh booking flow after checkout success',
            example: 'Book another service same day',
          },
        ],

  share_my_booking: (cmd) =>
    parseShareMyBookingFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Share my booking',
            message:
              'Ask to share your appointment with someone using the native share sheet',
            example: 'Share my appointment with my partner',
          },
        ],

  get_manage_link: (cmd) =>
    parseGetManageLinkFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Manage link',
            message:
              'Ask for your booking manage link or resend it using your email or phone',
            example: 'Resend manage link to john@example.com',
          },
        ],

  notify_running_late: (cmd) =>
    parseNotifyRunningLateFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Running late',
            message:
              'Say you are running late for your appointment and how many minutes',
            example: "I'm 15 minutes late for my appointment",
          },
        ],

  leave_visit_review: (cmd) =>
    parseLeaveVisitReviewFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Visit review',
            message:
              'Ask to rate or review a completed visit (optionally with stars)',
            example: 'Rate my last visit',
          },
        ],

  explain_post_visit_review_prompt: (cmd) =>
    parseExplainPostVisitReviewPromptFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Review popup',
            message:
              'Ask about the post-visit review popup (why it shows or how to skip)',
            example: 'Why am I seeing a review popup?',
          },
        ],

  explain_share_reward: (cmd) =>
    parseExplainShareRewardFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Share rewards',
            message:
              'Ask how share rewards work (points or perks for sharing a booking or salon link)',
            example: 'Do I get points for sharing?',
          },
        ],

  sign_in_after_booking: (cmd) =>
    parseSignInAfterBookingFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Post-booking sign-in',
            message:
              'Ask about saving a guest booking to your account after checkout',
            example: 'Save this booking to my account',
          },
        ],

  report_booking_problem: (cmd) =>
    parseReportBookingProblemFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Booking problem',
            message:
              'Describe the problem with your booking or visit (billing or service issue)',
            example: 'Something went wrong with my visit',
          },
        ],

  join_waitlist: (cmd) =>
    parseJoinWaitlistFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Join waitlist',
            message:
              'Ask to join the waitlist and say what service or day you want alerts for',
            example: 'Notify me if something opens Friday',
          },
        ],

  check_waitlist_status: (cmd) =>
    parseCheckWaitlistStatusFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Waitlist status',
            message: 'Ask whether you are on the waitlist',
            example: 'Am I on the waitlist?',
          },
        ],

  rebook_last_appointment: (cmd) =>
    parseRebookLastAppointmentFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Rebook last visit',
            message: 'Ask to rebook or repeat your last completed visit',
            example: 'Book the same as last time',
          },
        ],

  explain_cancel_policy: (cmd) =>
    parseExplainCancelPolicyFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Cancellation policy',
            message:
              'Ask about cancellation rules, notice window, or reschedule policy',
            example: 'Explain the cancellation policy',
          },
        ],

  explain_deposit_forfeiture: (cmd) =>
    parseExplainDepositForfeitureFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Deposit forfeiture',
            message:
              'Ask whether a deposit or prepayment is forfeited or refundable when cancelling',
            example: 'Do I lose my deposit if I cancel?',
          },
        ],

  explain_package_visit_rules: (cmd) =>
    parseExplainPackageVisitRulesFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Package visit rules',
            message:
              'Ask how package visit bundles work — cancel one visit, expiry, or terms',
            example: 'Can I cancel one visit and keep the package?',
          },
        ],

  explain_loyalty_points: (cmd) =>
    parseExplainLoyaltyPointsFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Loyalty points',
            message:
              'Ask how loyalty points are earned, what they are worth, or how the program works',
            example: 'How do I earn points?',
          },
        ],

  explain_my_subscription: (cmd) =>
    parseExplainMySubscriptionFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'My subscription',
            message:
              'Ask about visits left, expiry, or how your membership plan works',
            example: 'How many visits left on my plan?',
          },
        ],

  list_my_upcoming_appointments: (cmd) =>
    parseListMyUpcomingAppointmentsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Upcoming appointments',
            message:
              'Ask about your next appointment or upcoming visits this week',
            example: "What's my next appointment?",
          },
        ],

  resume_pending_payment: (cmd) =>
    parseResumePendingPaymentFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Resume pending payment',
            message:
              'Ask to restore an in-progress checkout after closing the app mid-payment',
            example: 'Continue my payment',
          },
        ],

  diagnose_stripe_checkout_failure: (cmd) =>
    parseConsumerDiagnoseStripeCheckoutFailureFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    ) || isDiagnoseStripeCheckoutFailurePrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Checkout payment failure',
            message:
              'Describe a failed or declined online checkout payment and ask what to do next',
            example: 'Payment failed — what now?',
          },
        ],

  pay_at_venue_fallback: (cmd) =>
    parsePayAtVenueFallbackFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Pay at venue fallback',
            message: 'Ask to skip online payment and pay at the salon instead',
            example: 'Pay at salon instead',
          },
        ],

  resume_booking_draft: (cmd) =>
    parseResumeBookingDraftFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Resume booking draft',
            message:
              'Ask to continue an unfinished booking saved on this device',
            example: 'Continue where I left off',
          },
        ],

  explain_slot_no_longer_available: (cmd) =>
    parseExplainSlotNoLongerAvailableFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Explain slot no longer available',
            message:
              'Describe the slot that disappeared at checkout (e.g. "That time disappeared")',
            example: 'Someone took my slot',
          },
        ],

  explain_multi_service_payment_return: (cmd) =>
    parseExplainMultiServicePaymentReturnFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    )
      ? []
      : [
          {
            field: 'prompt',
            label: 'Explain multi-service payment return',
            message:
              'Ask about confirming a multi-service visit after Stripe checkout',
            example: 'I paid but booking not confirmed',
          },
        ],

  retry_failed_network_action: (cmd) =>
    parseRetryFailedNetworkActionFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Retry failed network action',
            message:
              'Ask to retry after a network error (e.g. "Booking didn\'t save — retry?")',
            example: 'Sync failed',
          },
        ],

  explain_voice_input: (cmd) =>
    parseExplainVoiceInputFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Explain voice input',
            message:
              'Ask about using the assistant microphone or fixing voice errors',
            example: 'How do I use voice?',
          },
        ],

  speak_assistant_reply: (cmd) =>
    parseSpeakAssistantReplyFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Speak assistant reply',
            message:
              'Ask to hear the last assistant answer aloud (e.g. "Read that aloud")',
            example: 'Read that aloud',
          },
        ],

  give_ai_feedback: (cmd) =>
    parseGiveAiFeedbackFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Give AI feedback',
            message:
              'Say whether the last answer was helpful or what was wrong',
            example: 'That was wrong',
          },
        ],

  explain_rtl_layout: (cmd) =>
    parseExplainRtlLayoutFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Explain RTL layout',
            message:
              'Ask about reading direction or why text appears on the right',
            example: 'Why is text on the right?',
          },
        ],

  apply_promo_code_checkout: (cmd) =>
    parseApplyPromoCodeCheckoutFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'promoCode',
            label: 'Promo code',
            message: 'Name the promo code to apply at checkout',
            example: 'Apply code SAVE10 at checkout',
          },
        ],

  apply_loyalty_at_checkout: (cmd) =>
    parseApplyLoyaltyAtCheckoutFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Apply loyalty points',
            message:
              'Ask to apply loyalty or reward points to the current checkout',
            example: 'Use my points on this booking',
          },
        ],

  claim_gift_card_balance: (cmd) =>
    parseClaimGiftCardBalanceFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Claim gift card',
            message: 'Ask to redeem or add a gift card code to your account',
            example: 'Add gift card to account',
          },
        ],

  explain_tour_day_slots: (cmd) =>
    parseExplainTourDaySlotsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour day slots',
            message:
              'Ask about one departure per day, remainingSpots, or a fully booked tour date',
            example: 'Why does Mountain Trek show only one departure per day?',
          },
        ],

  explain_checkout_recommendations: (cmd) =>
    parseExplainCheckoutRecommendationsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Checkout recommendations',
            message:
              'Ask about You might also like product cards on the booking success screen',
            example:
              'What are these You might also like products on the confirmation screen?',
          },
        ],

  dismiss_recommendations: (cmd) =>
    parseDismissRecommendationsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Dismiss recommendations',
            message:
              'Ask to hide You might also like or product cards on the booking success screen',
            example: 'Hide You might also like',
          },
        ],

  buy_gift_card_for_someone: (cmd) =>
    parseBuyGiftCardForSomeoneFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Gift card for someone',
            message:
              'Ask to buy or email a gift card for someone else, e.g. for my mom or as a gift',
            example: 'Buy a $100 gift card for my mom',
          },
        ],

  explain_consumer_checkout_success: (cmd) =>
    parseExplainConsumerCheckoutSuccessFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Consumer checkout success',
            message:
              'Ask about the consumer app booking success screen, its actions, or when product cards appear',
            example:
              'Explain the booking success screen in the consumer app after I confirm',
          },
        ],

  explain_consumer_checkout_tax: (cmd) =>
    parseExplainConsumerCheckoutTaxFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Consumer checkout tax',
            message:
              'Ask about tax display in the consumer app: incl. badge on services, checkout tax lines, or confirmation breakdown',
            example: 'What does incl. VAT mean on services in the salon app?',
          },
        ],

  explain_checkout_tax: (cmd) =>
    parseExplainCheckoutTaxFromPrompt(cmd.prompt ?? '')
      ? []
      : [
          {
            field: 'prompt',
            label: 'Checkout tax',
            message:
              'Ask about tax display on the public booking page: incl. badge on service cards, checkout tax lines, or confirmation breakdown',
            example: 'What does incl. VAT mean on the service cards?',
          },
        ],

  explain_recommendation_analytics: (cmd) =>
    parseExplainRecommendationAnalyticsFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Recommendation analytics',
            message:
              'Ask about product_recommendation.shown impressions, clicked events, top products, or surface breakdown',
            example: 'Explain recommendation analytics',
          },
        ],

  summarize_recommendation_performance: (cmd) =>
    parseSummarizeRecommendationPerformanceFromPrompt(
      cmd.prompt ?? '',
      cmd.params,
    )
      ? []
      : [
          {
            field: 'prompt',
            label: 'Recommendation performance',
            message:
              'Ask about checkout recommendation CTR, CTR by product/service, or bookings with recommendations shown',
            example: 'Summarize recommendation performance',
          },
        ],

  diagnose_tour_capacity: (cmd) =>
    parseDiagnoseTourCapacityFromPrompt(cmd.prompt ?? '', cmd.params)
      ? []
      : [
          {
            field: 'prompt',
            label: 'Tour capacity diagnosis',
            message:
              'Ask why checkout rejected a pax count or tour date (max group, fully booked, clamped pax)',
            example: 'Why did checkout reject 4 people for the mountain trek?',
          },
        ],

  explain_app_feature: (cmd) =>
    buildAppGuideValidationIssues('explain_app_feature', cmd),
  guide_user_flow: (cmd) =>
    buildAppGuideValidationIssues('guide_user_flow', cmd),
  explain_current_screen: (cmd) =>
    buildAppGuideValidationIssues('explain_current_screen', cmd),
  explain_ai_settings: (cmd) =>
    buildMetaGuideValidationIssues('explain_ai_settings', cmd),
  explain_ai_suggestions: (cmd) =>
    buildMetaGuideValidationIssues('explain_ai_suggestions', cmd),
  explain_assistant_approval: (cmd) =>
    buildMetaGuideValidationIssues('explain_assistant_approval', cmd),
  explain_visibility_block: (cmd) =>
    buildEmptyStateGuideValidationIssues('explain_visibility_block', cmd),
  explain_empty_catalog: (cmd) =>
    buildEmptyStateGuideValidationIssues('explain_empty_catalog', cmd),
  explain_stripe_not_connected: (cmd) =>
    buildEmptyStateGuideValidationIssues('explain_stripe_not_connected', cmd),

  upload_patient_result: validateClinicTestResultExtCommand,
  explain_patient_results: validateClinicTestResultExtCommand,
  configure_test_reference_range: validateClinicTestResultExtCommand,
  list_abnormal_results: validateClinicTestResultExtCommand,
};

/** Entity resolution failures become clarify prompts */
export function validateEntityResolution(
  cmd: ResolvedCommand,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { params, entities } = cmd;

  const requestedNames = getRequestedEmployeeNames(params);

  if (
    requestedNames.length > 1 &&
    entities.employees.length < requestedNames.length
  ) {
    const unmatched = requestedNames.filter(
      (name) =>
        !entities.employees.some(
          (e) =>
            e.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(e.name.toLowerCase()) ||
            e.name
              .toLowerCase()
              .split(/\s+/)
              .some((part) => part === name.toLowerCase()),
        ),
    );
    issues.push({
      field: 'employeeName',
      label: 'Service providers',
      message:
        entities.employees.length === 0
          ? `Could not find providers: ${requestedNames.join(', ')}`
          : `Found ${entities.employees.map((e) => e.name).join(', ')} but could not match: ${unmatched.join(', ') || requestedNames.join(', ')}`,
      example: `Available: ${cmd.enrichedParams._availableEmployees ?? 'check team list'}`,
    });
  } else if (
    params.employeeName &&
    !params.allProviders &&
    (entities.employees?.length ?? 0) === 0 &&
    !(cmd.action === 'mark_paid' && params.date && params.timeSlot)
  ) {
    issues.push({
      field: 'employeeName',
      label: 'Service provider',
      message: `Could not find "${params.employeeName}"`,
      example: `Available: ${cmd.enrichedParams._availableEmployees ?? 'check team list'}`,
    });
  }

  if (
    params.serviceName &&
    !entities.service &&
    cmd.action === 'create_booking'
  ) {
    issues.push({
      field: 'serviceName',
      label: 'Service',
      message: `Could not find service "${params.serviceName}"`,
      example: `Available: ${cmd.enrichedParams._availableServices ?? 'check catalog'}`,
    });
  }

  if (
    params.customerName &&
    !entities.customer &&
    cmd.action === 'create_booking'
  ) {
    // e2e-bug.362 (D5) — `entities.customer` is now undefined on a *tie* as
    // well as on a miss, because the pipeline refuses to pick between two
    // people with the same name. The pipeline sets `entities.customers` only
    // in that case, so it is the signal that tells the two apart.
    //
    // "Could not find customer John Smith" when there are two of them is
    // worse than the silent pick it replaced — it is wrong about the CRM.
    const tied = entities.customers ?? [];
    issues.push(
      tied.length > 1
        ? {
            field: 'customerName',
            label: 'Customer',
            message: `"${params.customerName}" matches more than one customer — which did you mean?`,
            example: tied.map((c) => c.name).join(' or '),
          }
        : {
            field: 'customerName',
            label: 'Customer',
            message: `Could not find customer "${params.customerName}"`,
            example: 'Omit customer for walk-in, or add them in Customers first',
          },
    );
  }

  if (
    params.templateName &&
    !entities.template &&
    ['apply_schedule', 'setup_week_schedule'].includes(cmd.action)
  ) {
    issues.push({
      field: 'templateName',
      label: 'Template',
      message: `Could not find template "${params.templateName}"`,
    });
  }

  return issues;
}

export function validateCommand(cmd: ResolvedCommand): ValidationResult {
  const rule = ACTION_RULES[cmd.action];
  const fieldIssues = rule ? rule(cmd) : [];
  const aiCmdEntityIssues = validateAiCmdEntityFields(cmd);
  const entityIssues = validateEntityResolution(cmd);
  const issues = [...fieldIssues, ...aiCmdEntityIssues, ...entityIssues];

  return { ok: issues.length === 0, issues };
}

const VALIDATED_ACTIONS = new Set([
  'create_booking',
  'create_service',
  'create_services',
  'cancel_bookings',
  'bulk_smart_cancel',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'fill_slot_from_waitlist',
  'reschedule_booking',
  'check_availability',
  'show_appointments',
  'list_bookings',
  'summarize_day',
  'fill_unused_slots',
  'apply_schedule',
  'block_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'clear_schedule',
  'create_direct_schedule',
  'assign_employee_services',
  'unassign_employee_services',
  'transfer_employee_services',
  'list_schedule_gaps',
  'create_schedule_template',
  'mark_no_shows',
  'no_show_recovery',
  'payment_sweep',
  'update_bookings',
  'day_replan',
  'sick_day_replan',
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'check_schedule_compliance',
  'revenue_forecast',
  'configure_business_currency',
  'configure_business_languages',
  'configure_business_date_format',
  'configure_recommendation_product',
  'link_recommended_products',
  'explain_app_feature',
  'guide_user_flow',
  'explain_current_screen',
]);

export const APP_GUIDE_VALIDATED_ACTIONS = new Set<string>([
  'explain_app_feature',
  'guide_user_flow',
  'explain_current_screen',
]);

export const META_GUIDE_VALIDATED_ACTIONS = new Set<string>([
  'explain_ai_settings',
  'explain_ai_suggestions',
  'explain_assistant_approval',
]);

export const EMPTY_STATE_GUIDE_VALIDATED_ACTIONS = new Set<string>([
  'explain_visibility_block',
  'explain_empty_catalog',
  'explain_stripe_not_connected',
]);

export function shouldValidateAction(action: string): boolean {
  return (
    VALIDATED_ACTIONS.has(action) ||
    APP_GUIDE_VALIDATED_ACTIONS.has(action) ||
    META_GUIDE_VALIDATED_ACTIONS.has(action) ||
    EMPTY_STATE_GUIDE_VALIDATED_ACTIONS.has(action) ||
    isAiCmdEntityValidatedAction(action) ||
    isClinicTestResultExtValidatedIntent(action)
  );
}

export function buildClarifySummary(issues: ValidationIssue[]): string {
  if (issues.length === 1) {
    const i = issues[0];
    return `I need one more detail: ${i.message}.${i.example ? ` Example: "${i.example}"` : ''}`;
  }
  const lines = ['I need a few more details before I can run this:'];
  for (const i of issues) {
    lines.push(`• ${i.label}: ${i.message}`);
  }
  return lines.join('\n');
}
