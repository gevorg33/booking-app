import {
  ValidationIssue,
  ValidationResult,
} from './command-completion.types.js';
import {
  parseMetaProductGuideIntentFromPrompt,
  parseProviderProductGuideIntentFromPrompt,
} from './ai-product-guide-completion.util.js';
import { PROVIDER_PRODUCT_GUIDE_INTENTS } from './ai-provider-product-guide.util.js';
import type { ProviderProductGuideIntent } from './ai-provider-product-guide.util.js';
import { PROVIDER_META_GUIDE_INTENTS } from './ai-meta-product-guide.fixtures.js';
import type { ProviderMetaGuideIntent } from './ai-meta-product-guide.fixtures.js';
import {
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
} from './ai-product-guide-empty-state.fixtures.js';
import type { ProviderEmptyStateGuideIntent } from './ai-product-guide-empty-state.fixtures.js';
import { buildClarifySummary } from './command-completion.validator.js';
import {
  hasAvailabilityWhen,
  hasRescheduleNewTime,
} from './booking-time-completion.util.js';
import { parseRetailSalesLinesFromPrompt } from './ai-retail-finance.util.js';

const PROVIDER_VALIDATED_ACTIONS = new Set([
  'cancel_bookings',
  'update_bookings',
  'mark_no_shows',
  'payment_sweep',
  'list_bookings',
  'show_appointments',
  'team_whos_next',
  'summarize_day',
  'reschedule_booking',
  'fill_unused_slots',
  'suggest_waitlist_for_gap',
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
  'check_availability',
  'block_schedule',
  'summarize_utilization',
  'check_in_client',
  'mark_running_late',
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
  'set_retail_sales_lines',
  ...PROVIDER_PRODUCT_GUIDE_INTENTS,
  ...PROVIDER_META_GUIDE_INTENTS,
  ...PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
]);

export const PROVIDER_GUIDE_VALIDATED_ACTIONS = new Set<string>([
  ...PROVIDER_PRODUCT_GUIDE_INTENTS,
  ...PROVIDER_META_GUIDE_INTENTS,
  ...PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
]);

export function shouldValidateProviderAction(action: string): boolean {
  return PROVIDER_VALIDATED_ACTIONS.has(action);
}

function hasBookingFilter(params: Record<string, unknown>): boolean {
  return (
    !!params.date ||
    !!params.customerName ||
    params.allAppointments === true ||
    !!params.timeSlot ||
    !!params.serviceName ||
    !!params.bookingId
  );
}

function readPrompt(params: Record<string, unknown>): string {
  return typeof params._prompt === 'string' ? params._prompt : '';
}

function buildProviderGuideValidationIssues(
  action: ProviderProductGuideIntent,
  params: Record<string, unknown>,
): ValidationIssue[] {
  if (
    parseProviderProductGuideIntentFromPrompt(
      action,
      readPrompt(params),
      params,
    )
  ) {
    return [];
  }
  return [
    {
      field: 'prompt',
      label: 'Provider guide',
      message:
        'Ask about the provider app screen, invite link, team view, profile settings, assistant confirm swipe, or compound steps',
      example: 'What is this invite link?',
    },
  ];
}

function buildProviderMetaGuideValidationIssues(
  action: ProviderMetaGuideIntent,
  params: Record<string, unknown>,
): ValidationIssue[] {
  if (
    parseMetaProductGuideIntentFromPrompt(action, readPrompt(params), params)
  ) {
    return [];
  }
  if (action === 'explain_ai_suggestions') {
    return [
      {
        field: 'prompt',
        label: 'AI suggestions',
        message:
          'Ask what Today tab suggestion cards mean, or pass suggestionId for a specific chip',
        example: 'What are the Today tab AI suggestion cards?',
      },
    ];
  }
  return [
    {
      field: 'prompt',
      label: 'Assistant approval',
      message:
        'Ask about swipe-to-confirm preview or what will change before AI mutates bookings',
      example: 'Why swipe to confirm before AI changes run?',
    },
  ];
}

function buildProviderEmptyStateGuideValidationIssues(
  action: ProviderEmptyStateGuideIntent,
  params: Record<string, unknown>,
): ValidationIssue[] {
  const prompt = readPrompt(params);
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
          'Ask why a provider app screen or team view is missing for your role',
        example: "Why can't I see the team schedule tab?",
      },
    ];
  }
  return [
    {
      field: 'prompt',
      label: 'Empty catalog',
      message:
        'Ask why no services appear on your provider profile or booking flow',
      example: 'No services are assigned to my profile',
    },
  ];
}

const PROVIDER_ACTION_RULES: Record<
  string,
  (params: Record<string, unknown>) => ValidationIssue[]
> = {
  cancel_bookings: (params) =>
    hasBookingFilter(params)
      ? []
      : [
          {
            field: 'date',
            label: 'Which appointments',
            message:
              'Specify which appointments to cancel (today, a customer, or a time)',
            example: "Cancel all my appointments today — I'm sick",
          },
        ],

  update_bookings: (params) => {
    const hasTarget =
      params.allAppointments === true ||
      !!params.customerName ||
      !!params.timeSlot ||
      !!params.bookingId;
    const hasChange = !!params.status || !!params.paymentStatus;
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'customerName',
              label: 'Appointment',
              message: 'Specify which appointment(s) to update',
              example: "Mark John's 13:00 as done and paid",
            },
          ]),
      ...(hasChange
        ? []
        : [
            {
              field: 'status',
              label: 'Update',
              message: 'Specify status and/or payment to apply',
              example: 'Mark all today as done with payment paid',
            },
          ]),
    ];
  },

  mark_no_shows: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to mark no-shows for',
            example: 'Mark no-shows for today',
          },
        ],

  payment_sweep: (params) =>
    params.date || params.dateFrom || params.allAppointments === true
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to run payment sweep for',
            example: 'Payment sweep for today',
          },
        ],

  list_bookings: () => [],
  show_appointments: () => [],
  team_whos_next: () => [],
  summarize_day: () => [],
  check_availability: (params) =>
    hasAvailabilityWhen(params)
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify which day to check',
            example: 'Any open slots this afternoon?',
          },
        ],
  block_schedule: (params) =>
    params.date || params.dateFrom || params.timeFrom
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify when to block time',
            example: 'Block lunch 12:00–13:00 today',
          },
        ],
  summarize_utilization: () => [],

  reschedule_booking: (params) => {
    const hasTarget =
      !!params.customerName ||
      !!params.timeSlot ||
      params.allAppointments === true;
    const hasNewTime = hasRescheduleNewTime(params);
    return [
      ...(hasTarget
        ? []
        : [
            {
              field: 'customerName',
              label: 'Appointment',
              message: 'Specify which appointment to reschedule',
              example: 'Reschedule John at 13:00 to 16:00',
            },
          ]),
      ...(hasNewTime
        ? []
        : [
            {
              field: 'timeSlot',
              label: 'New time',
              message: 'Specify the new time',
              example: 'Move to 16:00',
            },
          ]),
    ];
  },

  fill_unused_slots: (params) =>
    params.date || params.dateFrom || params.timeFrom
      ? []
      : [
          {
            field: 'date',
            label: 'When',
            message: 'Specify when to fill gaps',
            example: 'Fill gaps this afternoon between 14:00 and 18:00',
          },
        ],

  suggest_waitlist_for_gap: (params) =>
    (params.date || params.dateFrom) && params.timeFrom && params.timeTo
      ? []
      : [
          {
            field: 'timeFrom',
            label: 'Gap window',
            message: 'Specify the gap date and time window',
            example: 'Fill this gap on 09/06/2026 from 14:00 to 15:30',
          },
        ],

  add_retail_to_booking: (params) =>
    params.bookingId || params.customerName || params.productName
      ? []
      : [
          {
            field: 'productName',
            label: 'Product',
            message: 'Name the product and booking',
            example: 'Add shampoo to Jane booking',
          },
        ],

  send_client_message: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client to message',
            example: 'Text Jane running late',
          },
        ],

  set_retail_sales_lines: (params) => {
    const hasTarget = !!(params.bookingId || params.customerName);
    const hasLines =
      (Array.isArray(params.lines) && params.lines.length > 0) ||
      parseRetailSalesLinesFromPrompt(readPrompt(params)).length > 0;
    const issues: ValidationIssue[] = [];
    if (!hasTarget) {
      issues.push({
        field: 'bookingId',
        label: 'Booking',
        message: 'Open an appointment or name the client for this cart',
        example: 'Set retail cart to 2 shampoo for Jane',
      });
    }
    if (!hasLines) {
      issues.push({
        field: 'lines',
        label: 'Cart lines',
        message: 'Specify the retail products and quantities',
        example: 'Set retail cart to 2 shampoo, 1 conditioner',
      });
    }
    return issues;
  },

  block_my_time: (params) =>
    params.date &&
    (params.timeFrom || params.startTime) &&
    (params.timeTo || params.endTime)
      ? []
      : params.timeFrom || params.startTime
        ? []
        : [
            {
              field: 'timeFrom',
              label: 'Block window',
              message: 'Specify when to block your calendar',
              example: 'Block my lunch 12:00 to 13:00 today',
            },
          ],

  request_time_off: (params) =>
    params.startDate || params.date || params.dateFrom
      ? []
      : [
          {
            field: 'startDate',
            label: 'Dates',
            message: 'Specify the dates you need off',
            example: 'Request June 10–12 off',
          },
        ],

  check_in_client: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client to check in',
            example: 'Check in Jane Doe',
          },
        ],

  mark_running_late: (params) =>
    params.bookingId || params.customerName
      ? []
      : [
          {
            field: 'customerName',
            label: 'Client',
            message: 'Open an appointment or name the client for running late',
            example: "I'm running 10 minutes late for Jane",
          },
        ],

  explain_staff_invite: (params) =>
    buildProviderGuideValidationIssues('explain_staff_invite', params),
  explain_provider_app_tabs: (params) =>
    buildProviderGuideValidationIssues('explain_provider_app_tabs', params),
  explain_team_view_scope: (params) =>
    buildProviderGuideValidationIssues('explain_team_view_scope', params),
  explain_profile_settings: (params) =>
    buildProviderGuideValidationIssues('explain_profile_settings', params),
  explain_assistant_confirm_swipe: (params) =>
    buildProviderGuideValidationIssues(
      'explain_assistant_confirm_swipe',
      params,
    ),
  explain_provider_compound_steps: (params) =>
    buildProviderGuideValidationIssues(
      'explain_provider_compound_steps',
      params,
    ),
  explain_ai_suggestions: (params) =>
    buildProviderMetaGuideValidationIssues('explain_ai_suggestions', params),
  explain_assistant_approval: (params) =>
    buildProviderMetaGuideValidationIssues(
      'explain_assistant_approval',
      params,
    ),
  explain_visibility_block: (params) =>
    buildProviderEmptyStateGuideValidationIssues(
      'explain_visibility_block',
      params,
    ),
  explain_empty_catalog: (params) =>
    buildProviderEmptyStateGuideValidationIssues(
      'explain_empty_catalog',
      params,
    ),
};

export function validateProviderCommand(
  action: string,
  params: Record<string, unknown>,
): ValidationResult {
  const rule = PROVIDER_ACTION_RULES[action];
  const issues = rule ? rule(params) : [];
  return { ok: issues.length === 0, issues };
}

export { buildClarifySummary };
