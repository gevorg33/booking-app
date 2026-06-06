import type {
  ResolvedCommand,
  ValidationIssue,
} from './command-completion.types.js';
import {
  hasRequiredBookingDate,
  hasRequiredBookingStartTime,
  hasRescheduleNewTime,
} from './booking-time-completion.util.js';

type EntityRule = (cmd: ResolvedCommand) => ValidationIssue[];

const issue = (
  field: string,
  label: string,
  message: string,
  example: string,
): ValidationIssue => ({ field, label, message, example });

const paramPresent = (cmd: ResolvedCommand, key: string): boolean => {
  const value = cmd.params[key] ?? cmd.enrichedParams[key];
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const hasDate = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'date') ||
  paramPresent(cmd, 'dateFrom') ||
  hasRequiredBookingDate(cmd.params);

const hasTime = (cmd: ResolvedCommand): boolean =>
  hasRequiredBookingStartTime(cmd.params);

const hasPackage = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'packageName') || paramPresent(cmd, 'packageId');

const hasCustomer = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'customerName') ||
  paramPresent(cmd, 'customerId') ||
  !!cmd.entities.customer;

const hasBooking = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'bookingId') || hasCustomer(cmd);

const hasServices = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'serviceNames') ||
  paramPresent(cmd, 'serviceIds') ||
  paramPresent(cmd, 'serviceName') ||
  !!cmd.entities.service ||
  (cmd.entities.services?.length ?? 0) > 0;

const hasProvider = (cmd: ResolvedCommand): boolean =>
  paramPresent(cmd, 'employeeName') ||
  paramPresent(cmd, 'employeeId') ||
  cmd.params.allProviders === true ||
  (cmd.entities.employees?.length ?? 0) > 0;

/** Sprint26+ actions validated for shared entity clarify fields (ai-cmd-t4). */
export const AI_CMD_ENTITY_ACTION_RULES: Record<string, EntityRule> = {
  create_package_booking: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasPackage(cmd)) {
      issues.push(
        issue(
          'packageName',
          'Package',
          'Specify which package to book',
          'Spa Day package',
        ),
      );
    }
    if (!hasCustomer(cmd)) {
      issues.push(
        issue(
          'customerName',
          'Customer',
          'Specify the customer',
          'Maria Lopez',
        ),
      );
    }
    if (!hasDate(cmd)) {
      issues.push(
        issue(
          'date',
          'Date',
          'Specify appointment date',
          'tomorrow or 29/05/2026',
        ),
      );
    }
    if (!hasTime(cmd)) {
      issues.push(
        issue(
          'timeSlot',
          'Start time',
          'Specify start time',
          '10:00 or first available',
        ),
      );
    }
    return issues;
  },

  create_multi_service_booking: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasServices(cmd)) {
      issues.push(
        issue(
          'serviceNames',
          'Services',
          'Specify services for the multi-service booking',
          'haircut and beard trim',
        ),
      );
    }
    if (!hasProvider(cmd)) {
      issues.push(
        issue(
          'employeeName',
          'Service provider',
          'Specify a provider',
          'Anna Kim',
        ),
      );
    }
    if (!hasDate(cmd)) {
      issues.push(
        issue(
          'date',
          'Date',
          'Specify appointment date',
          'Tuesday or 29/05/2026',
        ),
      );
    }
    if (!hasTime(cmd)) {
      issues.push(
        issue('timeSlot', 'Start time', 'Specify start time', '10:00'),
      );
    }
    return issues;
  },

  book_package: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasPackage(cmd)) {
      issues.push(
        issue(
          'packageName',
          'Package',
          'Specify which package to book',
          'spa day package',
        ),
      );
    }
    if (!hasDate(cmd)) {
      issues.push(
        issue('date', 'Date', 'Specify when to book', 'tomorrow at 10am'),
      );
    }
    return issues;
  },

  book_multi_service: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasServices(cmd)) {
      issues.push(
        issue(
          'serviceNames',
          'Services',
          'Specify services to book',
          'massage and facial',
        ),
      );
    }
    if (!hasDate(cmd)) {
      issues.push(
        issue('date', 'Date', 'Specify when to book', 'Friday at 2pm'),
      );
    }
    return issues;
  },

  cancel_package_visit: (cmd) =>
    hasBooking(cmd)
      ? []
      : [
          issue(
            'bookingId',
            'Package visit',
            'Specify which package visit to cancel',
            'booking b1',
          ),
        ],

  reschedule_package_visit: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasBooking(cmd)) {
      issues.push(
        issue(
          'bookingId',
          'Package visit',
          'Specify which visit to reschedule',
          'booking b1',
        ),
      );
    }
    if (!hasRescheduleNewTime(cmd.params)) {
      issues.push(
        issue('date', 'New time', 'Specify new date and time', 'Friday 10am'),
      );
    }
    return issues;
  },

  cancel_multi_service_group: (cmd) =>
    hasBooking(cmd)
      ? []
      : [
          issue(
            'bookingId',
            'Multi-service group',
            'Specify which group to cancel',
            'booking b2',
          ),
        ],

  reschedule_multi_service_group: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasBooking(cmd)) {
      issues.push(
        issue(
          'bookingId',
          'Multi-service group',
          'Specify which group to move',
          'booking b2',
        ),
      );
    }
    if (!hasRescheduleNewTime(cmd.params)) {
      issues.push(issue('timeSlot', 'New time', 'Specify new time', '3pm'));
    }
    return issues;
  },

  assign_booking_resource: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!hasBooking(cmd) && !hasTime(cmd)) {
      issues.push(
        issue(
          'bookingId',
          'Booking',
          'Specify which booking to assign',
          '2pm facial',
        ),
      );
    }
    if (
      !paramPresent(cmd, 'resourceName') &&
      !paramPresent(cmd, 'resourceId')
    ) {
      issues.push(
        issue('resourceName', 'Resource', 'Specify room or resource', 'Room 2'),
      );
    }
    return issues;
  },

  bulk_create_catalog: (cmd) => {
    const hasDraft =
      (Array.isArray(cmd.params.categoryDraft) &&
        cmd.params.categoryDraft.length > 0) ||
      (Array.isArray(cmd.params.services) && cmd.params.services.length > 0) ||
      !!cmd.params.categoryName;
    return hasDraft
      ? []
      : [
          issue(
            'categoryDraft',
            'Catalog draft',
            'Provide category and service lines to create',
            "Create category Hair with Women's cut 60m $65",
          ),
        ];
  },

  create_package: (cmd) =>
    paramPresent(cmd, 'packageName')
      ? []
      : [
          issue(
            'packageName',
            'Package name',
            'Specify package name and included services',
            'Spa Day package',
          ),
        ],

  book_with_gift_card: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (
      !paramPresent(cmd, 'giftCardCode') &&
      !paramPresent(cmd, 'giftCardId')
    ) {
      issues.push(
        issue(
          'giftCardCode',
          'Gift card',
          'Provide gift card code',
          'GC-ABC123',
        ),
      );
    }
    if (!hasServices(cmd) && !hasPackage(cmd)) {
      issues.push(
        issue(
          'serviceName',
          'Service or package',
          'Specify what to book',
          'facemassage',
        ),
      );
    }
    if (!hasDate(cmd)) {
      issues.push(
        issue('date', 'Date', 'Specify appointment date', 'tomorrow at 10am'),
      );
    }
    return issues;
  },

  apply_gift_card_code: (cmd) =>
    paramPresent(cmd, 'giftCardCode')
      ? []
      : [
          issue(
            'giftCardCode',
            'Gift card code',
            'Provide the gift card code',
            'GC-ABC123',
          ),
        ],

  check_gift_card_balance: (cmd) =>
    paramPresent(cmd, 'giftCardCode')
      ? []
      : [
          issue(
            'giftCardCode',
            'Gift card code',
            'Provide gift card code to check',
            'GC-ABC123',
          ),
        ],

  select_subscription_plan: (cmd) =>
    paramPresent(cmd, 'subscriptionPlanId') || paramPresent(cmd, 'planName')
      ? []
      : [
          issue(
            'subscriptionPlanId',
            'Subscription plan',
            'Specify which plan to select',
            '12-month nail plan',
          ),
        ],

  use_subscription_credit: (cmd) =>
    hasServices(cmd) && hasDate(cmd)
      ? []
      : [
          ...(hasServices(cmd)
            ? []
            : [
                issue(
                  'serviceName',
                  'Service',
                  'Specify service to book with credit',
                  'nail care',
                ),
              ]),
          ...(hasDate(cmd)
            ? []
            : [
                issue(
                  'date',
                  'Date',
                  'Specify appointment date',
                  'tomorrow 10am',
                ),
              ]),
        ],

  add_services_to_cart: (cmd) =>
    hasServices(cmd)
      ? []
      : [
          issue(
            'serviceNames',
            'Services',
            'Specify services to add to cart',
            'massage',
          ),
        ],

  configure_zendesk: (cmd) =>
    paramPresent(cmd, 'subdomain') || paramPresent(cmd, 'zendeskSubdomain')
      ? []
      : [
          issue(
            'subdomain',
            'Zendesk subdomain',
            'Provide Zendesk subdomain',
            'mybusiness.zendesk.com',
          ),
        ],

  create_product: (cmd) => {
    const issues: ValidationIssue[] = [];
    if (!paramPresent(cmd, 'productName') && !paramPresent(cmd, 'name')) {
      issues.push(
        issue(
          'productName',
          'Product name',
          'Specify product name',
          'shampoo 500ml',
        ),
      );
    }
    if (cmd.params.price == null) {
      issues.push(issue('price', 'Price', 'Specify product price', '$18'));
    }
    return issues;
  },
};

export const AI_CMD_ENTITY_VALIDATED_ACTIONS = new Set(
  Object.keys(AI_CMD_ENTITY_ACTION_RULES),
);

export function isAiCmdEntityValidatedAction(action: string): boolean {
  return AI_CMD_ENTITY_VALIDATED_ACTIONS.has(action);
}

export function validateAiCmdEntityFields(
  cmd: ResolvedCommand,
): ValidationIssue[] {
  const rule = AI_CMD_ENTITY_ACTION_RULES[cmd.action];
  return rule ? rule(cmd) : [];
}
