import { Injectable } from '@nestjs/common';
import {
  isClearSchedulePrompt,
  isScheduleTemplateCreationPrompt,
  isProviderOwnServicesPrompt,
} from './ai-orchestration.helpers.js';
import {
  extractProviderFallbackFromPrompt,
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
  enrichBookingTimeHintsFromPrompt,
  isTeamWideProviderAvailabilityQuery,
  extractStatusFiltersFromPrompt,
  isBulkAllAppointmentsPrompt,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
  extractLimitFromPrompt,
} from './ai-intent-heuristics.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';
import {
  extractCustomerBookingContextFromPrompt,
  extractSingleProviderNameFromPrompt,
  extractUpcomingAppointmentScope,
  isCustomerBookingContextPrompt,
  isSingleProviderRevenuePrompt,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  isCapacityRebalancePrompt,
  rescueSchedulingIntent,
} from './ai-scheduling.util.js';
import { rescueOperationsIntent } from './ai-operations.util.js';
import {
  isAssignCategoryToProviderPrompt,
  rescueAssignCategoryToProviderIntent,
} from './ai-category-assignment.util.js';
import { rescueBookingDepthIntent } from './ai-booking-depth.util.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';
import { rescueScheduleResourceIntent } from './ai-schedule-resources.util.js';
import { rescueGiftFulfillmentIntent } from './ai-gift-fulfillment.util.js';
import { rescueIntegrationsIntent } from './ai-integrations.util.js';
import { rescuePushNotificationsIntent } from './ai-push-notifications.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { rescueProviderBookingIntent } from './ai-provider-booking.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { rescueRetailFinanceIntent } from './ai-retail-finance.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';

export interface IntentRescueInput {
  prompt: string;
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  employees?: Array<{ id: string; name: string }>;
}

export interface IntentRescueResult {
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  rescued: boolean;
  rescueReason: string;
}

const READ_ONLY_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'check_availability',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'list_schedule_gaps',
  'summarize_utilization',
  'summarize_customers',
  'check_schedule_compliance',
  'revenue_forecast',
  'list_cash_pending_bookings',
  'list_package_bookings',
  'list_multi_service_bookings',
  'explain_booking_policy',
  'list_packages',
  'list_subscription_plans',
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
  'my_profile',
  'my_appointments',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'gift_card_redemption_history',
  'track_physical_gift_card_order',
  'discover_packages',
  'discover_subscription_plans',
  'discover_gift_card_products',
  'list_scheduling_resources',
  'list_resource_conflicts',
  'explain_resource_conflict',
  'my_resource_assignments',
  'check_multi_service_block_availability',
  'check_package_line_availability',
  'earliest_slot_all_services',
  'providers_available_later_days',
  'explain_why_no_slots',
  'summarize_unpaid',
  'validate_gift_card',
  'export_accounting',
  'export_commissions',
  'explain_checkout_total',
  'list_subscription_revenue',
  'check_providers_for_service',
  'book_nearest_slot',
  'apply_gift_card_code',
  'check_gift_card_balance',
  'buy_gift_card',
  'buy_gift_card_physical',
  'choose_payment_method',
  'pay_online',
  'pay_cash_at_visit',
  'purchase_subscription_checkout',
  'explain_why_stripe_required',
  'receipt_status',
  'explain_payment_status',
  'list_gift_card_orders',
  'filter_awaiting_creation',
  'print_packing_slip',
  'gift_card_creation_queue',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
  'delivery_queue',
  'track_gift_card_shipment',
  'shipping_method_quote',
  'order_status_notifications',
]);

@Injectable()
export class AiIntentRescueService {
  rescue(input: IntentRescueInput): IntentRescueResult | null {
    const { prompt, employees = [] } = input;
    const { action, params, reasoning } = input;

    if (action !== 'unknown') {
      const disambiguated = this.disambiguateMisclassified(
        prompt,
        action,
        params,
        employees,
      );
      if (disambiguated) return disambiguated;
      const scheduling = this.tryRescueScheduling(prompt, action, params);
      if (scheduling) return scheduling;
      const operations = this.tryRescueOperations(prompt, action, params);
      if (operations) return operations;
      const providerBookingEarly = this.tryRescueProviderBooking(
        prompt,
        action,
      );
      if (providerBookingEarly) return providerBookingEarly;
      const bookingDepthEarly = this.tryRescueBookingDepth(prompt, action);
      if (bookingDepthEarly) return bookingDepthEarly;
      const selfServiceBooking = this.tryRescueSelfServiceBooking(
        prompt,
        action,
      );
      if (selfServiceBooking) return selfServiceBooking;
      const pushNotifications = this.tryRescuePushNotifications(prompt, action);
      if (pushNotifications) return pushNotifications;
      const marketingGrowth = this.tryRescueMarketingGrowth(prompt, action);
      if (marketingGrowth) return marketingGrowth;
      const retailFinance = this.tryRescueRetailFinance(prompt, action);
      if (retailFinance) return retailFinance;
      const integrations = this.tryRescueIntegrations(prompt, action);
      if (integrations) return integrations;
      const giftFulfillment = this.tryRescueGiftFulfillment(prompt, action);
      if (giftFulfillment) return giftFulfillment;
      const payments = this.tryRescuePayments(prompt, action);
      if (payments) return payments;
      const scheduleResources = this.tryRescueScheduleResources(prompt, action);
      if (scheduleResources) return scheduleResources;
      const catalog = this.tryRescueCatalog(prompt, action);
      if (catalog) return catalog;
      const providerBookingBeforeCrm = this.tryRescueProviderBooking(
        prompt,
        action,
      );
      if (providerBookingBeforeCrm) return providerBookingBeforeCrm;
      const customerCrm = this.tryRescueCustomerCrm(prompt, action);
      if (customerCrm) return customerCrm;
      return null;
    }

    if (isTopStaffRevenuePrompt(prompt)) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning:
          'Rank specialists/providers by revenue for the requested period.',
        rescued: true,
        rescueReason: 'top_staff_revenue',
      };
    }

    if (isTotalEarningsPrompt(prompt)) {
      return {
        action: 'summarize_bookings',
        params: { ...params, bookingMetric: 'revenue' },
        reasoning: 'Calculate total earnings/revenue for the requested period.',
        rescued: true,
        rescueReason: 'total_earnings',
      };
    }

    if (isCustomerBookingContextPrompt(prompt)) {
      const ctx = extractCustomerBookingContextFromPrompt(prompt);
      return {
        action: 'lookup_customer',
        params: {
          ...params,
          customerName: ctx.customerName ?? params.customerName,
          employeeName: ctx.employeeName ?? params.employeeName,
          timeSlot: ctx.timeSlot ?? params.timeSlot,
          date: ctx.dateHint ?? params.date ?? 'today',
          bookingContext: true,
        },
        reasoning: 'Customer profile with booking context (provider/time).',
        rescued: true,
        rescueReason: 'customer_booking_context',
      };
    }

    if (isUpcomingAppointmentsPrompt(prompt)) {
      const scope = extractUpcomingAppointmentScope(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          upcomingOnly: true,
          allProviders: scope.allProviders,
          employeeNames: scope.employeeNames.length
            ? scope.employeeNames
            : params.employeeNames,
          date: params.date ?? 'today',
        },
        reasoning: 'List upcoming appointments for selected provider scope.',
        rescued: true,
        rescueReason: 'upcoming_appointments',
      };
    }

    if (isSingleProviderRevenuePrompt(prompt)) {
      const employeeName =
        extractSingleProviderNameFromPrompt(prompt) ?? params.employeeName;
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          employeeName,
          limit: employeeName
            ? 1
            : Math.min(extractLimitFromPrompt(prompt), 10),
        },
        reasoning: 'Provider revenue summary for the requested period.',
        rescued: true,
        rescueReason: 'single_provider_revenue',
      };
    }

    if (isAssignCategoryToProviderPrompt(prompt)) {
      const categoryAssign = rescueAssignCategoryToProviderIntent(
        prompt,
        action,
        params,
      );
      if (categoryAssign) {
        return {
          action: categoryAssign.action,
          params: categoryAssign.params,
          reasoning: 'Assign all services in a category to a named provider.',
          rescued: true,
          rescueReason: categoryAssign.rescueReason,
        };
      }
    }

    const schedulingUnknown = this.tryRescueScheduling(prompt, action, params);
    if (schedulingUnknown) return schedulingUnknown;
    const operationsUnknown = this.tryRescueOperations(prompt, action, params);
    if (operationsUnknown) return operationsUnknown;
    const catalogUnknown = this.tryRescueCatalog(prompt, action);
    if (catalogUnknown) return catalogUnknown;
    const selfServiceBookingUnknown = this.tryRescueSelfServiceBooking(
      prompt,
      action,
    );
    if (selfServiceBookingUnknown) return selfServiceBookingUnknown;
    const pushNotificationsUnknown = this.tryRescuePushNotifications(
      prompt,
      action,
    );
    if (pushNotificationsUnknown) return pushNotificationsUnknown;
    const marketingGrowthUnknown = this.tryRescueMarketingGrowth(
      prompt,
      action,
    );
    if (marketingGrowthUnknown) return marketingGrowthUnknown;
    const retailFinanceUnknown = this.tryRescueRetailFinance(prompt, action);
    if (retailFinanceUnknown) return retailFinanceUnknown;
    const integrationsUnknown = this.tryRescueIntegrations(prompt, action);
    if (integrationsUnknown) return integrationsUnknown;
    const giftFulfillmentUnknown = this.tryRescueGiftFulfillment(
      prompt,
      action,
    );
    if (giftFulfillmentUnknown) return giftFulfillmentUnknown;
    const paymentsUnknown = this.tryRescuePayments(prompt, action);
    if (paymentsUnknown) return paymentsUnknown;
    const scheduleResourcesUnknown = this.tryRescueScheduleResources(
      prompt,
      action,
    );
    if (scheduleResourcesUnknown) return scheduleResourcesUnknown;
    const providerBookingUnknown = this.tryRescueProviderBooking(
      prompt,
      action,
    );
    if (providerBookingUnknown) return providerBookingUnknown;
    const customerCrmUnknown = this.tryRescueCustomerCrm(prompt, action);
    if (customerCrmUnknown) return customerCrmUnknown;
    const bookingDepthUnknown = this.tryRescueBookingDepth(prompt, action);
    if (bookingDepthUnknown) return bookingDepthUnknown;

    if (isCapacityRebalancePrompt(prompt)) {
      return {
        action: 'rebalance_capacity',
        params,
        reasoning: 'Move booked capacity between providers.',
        rescued: true,
        rescueReason: 'rebalance_capacity_pattern',
      };
    }

    if (isClearSchedulePrompt(prompt)) {
      return {
        action: 'clear_schedule',
        params,
        reasoning: reasoning ?? 'Clear applied schedule for provider(s)',
        rescued: true,
        rescueReason: 'clear_schedule_heuristic',
      };
    }

    if (isScheduleTemplateCreationPrompt(prompt)) {
      return {
        action: 'create_schedule_template',
        params: {
          ...params,
          templateName: params.templateName ?? params.name,
        },
        reasoning:
          'Create a reusable schedule template from the described hours.',
        rescued: true,
        rescueReason: 'create_schedule_template_pattern',
      };
    }

    if (/\b(mark|flag|set).+no[\s-]?show/i.test(prompt)) {
      return {
        action: 'mark_no_shows',
        params,
        reasoning: 'Mark missed past appointments as no-show.',
        rescued: true,
        rescueReason: 'mark_no_shows_pattern',
      };
    }

    if (
      /\b(payment sweep|unpaid|collect payment|outstanding payment)/i.test(
        prompt,
      )
    ) {
      return {
        action: 'payment_sweep',
        params,
        reasoning: 'Sweep unpaid appointments and mark as paid.',
        rescued: true,
        rescueReason: 'payment_sweep_pattern',
      };
    }

    if (/\b(replan|redo|fix).+(?:day|schedule|calendar)/i.test(prompt)) {
      return {
        action: 'day_replan',
        params,
        reasoning: 'Analyze and replan the schedule for the requested day.',
        rescued: true,
        rescueReason: 'day_replan_pattern',
      };
    }

    if (
      isTeamWideProviderAvailabilityQuery(prompt) ||
      /\b(who (?:can|is|has)|which provider|available slots?|open times?|is .+ available)\b/i.test(
        prompt,
      )
    ) {
      if (!/\b(book|schedule|create appointment)\b/i.test(prompt)) {
        return {
          action: 'lookup_service_assignment',
          params: {
            ...params,
            assignmentLookup:
              params.assignmentLookup ?? 'providers_for_service',
          },
          reasoning: 'Checking provider availability for service.',
          rescued: true,
          rescueReason: 'availability_query',
        };
      }
    }

    if (/\b(check availability|available at|free at|open at)\b/i.test(prompt)) {
      return {
        action: 'check_availability',
        params,
        reasoning: 'Checking slot availability.',
        rescued: true,
        rescueReason: 'check_availability_pattern',
      };
    }

    if (/\b(show|list|display|view).+(appointment|booking)/i.test(prompt)) {
      const statuses = extractStatusFiltersFromPrompt(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          statusFilters: statuses.length ? statuses : params.statusFilters,
        },
        reasoning: 'Listing appointments.',
        rescued: true,
        rescueReason: 'show_appointments_pattern',
      };
    }

    if (
      /\b(reschedule|move|change time|shift)\b/i.test(prompt) &&
      !/\bmove\s+\d+\s+.+(?:slot|appointment)/i.test(prompt)
    ) {
      const rescuedParams = { ...params };
      if (isFirstAvailableBookingPrompt(prompt)) {
        rescuedParams.bookingFirstAvailable = true;
        delete rescuedParams.timeSlot;
      }
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Rescheduling appointment.',
        rescued: true,
        rescueReason: 'reschedule_pattern',
      };
    }

    if (
      /\b(book|schedule|reserve|appointment)\b/i.test(prompt) &&
      !/\b(cancel|hide|clear)\b/i.test(prompt)
    ) {
      const rescuedParams = { ...params };
      if (isFirstAvailableBookingPrompt(prompt)) {
        rescuedParams.bookingFirstAvailable = true;
        delete rescuedParams.timeSlot;
      }
      if (isAnyProviderBookingPrompt(prompt)) {
        rescuedParams.allProviders = true;
      }
      const fallback = extractProviderFallbackFromPrompt(prompt, employees);
      if (fallback.providerFallbackNames.length) {
        rescuedParams.providerFallbackNames = fallback.providerFallbackNames;
      }
      if (fallback.fallbackAnyProvider) {
        rescuedParams.fallbackAnyProvider = true;
      }
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning: 'Booking appointment from rescue heuristics.',
        rescued: true,
        rescueReason: 'create_booking_pattern',
      };
    }

    if (/\b(cancel|remove).+(appointment|booking)/i.test(prompt)) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      return {
        action: 'cancel_bookings',
        params: rescuedParams,
        reasoning: 'Cancelling appointments.',
        rescued: true,
        rescueReason: 'cancel_bookings_pattern',
      };
    }

    if (
      /\b(mark|set|update)\b.+\b(done|completed|no[\s-]?show|paid|payment|n\/a|not applicable)\b/i.test(
        prompt,
      )
    ) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      const status = extractBookingStatusFromPrompt(prompt);
      const paymentStatus = extractPaymentStatusFromPrompt(prompt);
      if (status && status !== BookingStatus.CANCELLED)
        rescuedParams.status = status;
      if (paymentStatus) rescuedParams.paymentStatus = paymentStatus;
      if (status === BookingStatus.CANCELLED) {
        return {
          action: 'cancel_bookings',
          params: rescuedParams,
          reasoning: 'Cancelling appointments.',
          rescued: true,
          rescueReason: 'cancel_from_update_pattern',
        };
      }
      return {
        action: 'update_bookings',
        params: rescuedParams,
        reasoning: 'Updating appointment status and/or payment.',
        rescued: true,
        rescueReason: 'update_bookings_pattern',
      };
    }

    if (
      /\b(hide|remove from calendar)\b/i.test(prompt) &&
      !/\bcancel\b/i.test(prompt)
    ) {
      return {
        action: 'hide_appointments_from_calendar',
        params,
        reasoning: 'Hiding appointments from calendar.',
        rescued: true,
        rescueReason: 'hide_calendar_pattern',
      };
    }

    if (/\b(fill|optimize).+(gap|slot|utilization)/i.test(prompt)) {
      return {
        action: 'fill_unused_slots',
        params,
        reasoning: 'Filling schedule gaps.',
        rescued: true,
        rescueReason: 'fill_gaps_pattern',
      };
    }

    if (isProviderOwnServicesPrompt(prompt)) {
      return {
        action: 'assign_employee_services',
        params,
        reasoning: 'Assigning services to provider.',
        rescued: true,
        rescueReason: 'assign_services_pattern',
      };
    }

    return null;
  }

  private tryRescueScheduling(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const rescued = rescueSchedulingIntent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'scheduling_intent',
    };
  }

  private tryRescueOperations(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const categoryAssign = rescueAssignCategoryToProviderIntent(
      prompt,
      action,
      params,
    );
    if (categoryAssign) {
      return {
        action: categoryAssign.action,
        params: categoryAssign.params,
        reasoning: 'Assign all services in a category to a named provider.',
        rescued: true,
        rescueReason: categoryAssign.rescueReason,
      };
    }
    const rescued = rescueOperationsIntent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'operations_booking_ops',
    };
  }

  private tryRescueBookingDepth(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueBookingDepthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Booking command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSelfServiceBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSelfServiceBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Customer booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePushNotifications(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePushNotificationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Push/notifications rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarketingGrowth(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueMarketingGrowthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Marketing/growth rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRetailFinance(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRetailFinanceIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Retail/finance rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueIntegrations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueIntegrationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Integrations rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGiftFulfillment(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGiftFulfillmentIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Gift fulfillment rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePayments(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePaymentsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Payments/checkout rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueScheduleResources(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueScheduleResourceIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Schedule/resource rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCustomerCrm(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCustomerCrmIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Customer CRM rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCatalog(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCatalogIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Catalog command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private disambiguateMisclassified(
    prompt: string,
    action: string,
    params: Record<string, any>,
    employees: Array<{ id: string; name: string }>,
  ): IntentRescueResult | null {
    const scheduling = this.tryRescueScheduling(prompt, action, params);
    if (scheduling) return scheduling;
    const operations = this.tryRescueOperations(prompt, action, params);
    if (operations) return operations;

    const lower = prompt.toLowerCase();

    if (
      action === 'create_booking' &&
      /\b(reschedule|move|shift)\b/i.test(lower) &&
      /\bappointment\b/i.test(lower)
    ) {
      const rescuedParams = { ...params };
      if (isFirstAvailableBookingPrompt(prompt)) {
        rescuedParams.bookingFirstAvailable = true;
        delete rescuedParams.timeSlot;
      }
      rescuedParams.customerName = null;
      delete rescuedParams.customerId;
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Move/reschedule existing appointment — not a new booking.',
        rescued: true,
        rescueReason: 'create_booking_to_reschedule',
      };
    }

    if (
      action === 'create_booking' &&
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt('create_booking', rescuedParams, prompt);
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning:
          'Check-then-book compound — flexible earliest slot, no fixed start time.',
        rescued: true,
        rescueReason: 'check_and_book_compound',
      };
    }

    if (
      (action === 'create_booking' || action === 'reschedule_booking') &&
      isFirstAvailableBookingPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt(action, rescuedParams, prompt);
      return {
        action,
        params: rescuedParams,
        reasoning:
          'Nearest/first available slot — no fixed start time required.',
        rescued: true,
        rescueReason: 'booking_first_available',
      };
    }

    if (
      action === 'create_booking' &&
      (isTeamWideProviderAvailabilityQuery(prompt) ||
        /\b(who (?:can|is|has)|which provider|schedule today at)\b/i.test(
          lower,
        )) &&
      !/\b(book|schedule|reserve)\b/i.test(lower)
    ) {
      return {
        action: 'lookup_service_assignment',
        params: { ...params, assignmentLookup: 'providers_for_service' },
        reasoning: 'Read-only provider availability — not a booking.',
        rescued: true,
        rescueReason: 'create_booking_to_lookup',
      };
    }

    if (
      action === 'show_appointments' &&
      /\b(book|schedule|reserve)\b/i.test(lower) &&
      !/\b(show|list|display|who)\b/i.test(lower)
    ) {
      return {
        action: 'create_booking',
        params,
        reasoning: 'Booking intent detected from prompt.',
        rescued: true,
        rescueReason: 'show_to_create_booking',
      };
    }

    if (
      action === 'list_bookings' &&
      /\b(most expensive|longest|shortest|earliest|latest)\b/i.test(lower)
    ) {
      return {
        action: 'analyze_appointments',
        params,
        reasoning: 'Analytics query — analyze appointments.',
        rescued: true,
        rescueReason: 'list_to_analyze_appointments',
      };
    }

    if (
      (action === 'list_bookings' ||
        action === 'show_appointments' ||
        action === 'summarize_day') &&
      isTotalEarningsPrompt(prompt)
    ) {
      return {
        action: 'summarize_bookings',
        params: { ...params, bookingMetric: 'revenue' },
        reasoning: 'Total earnings/revenue query — booking analytics.',
        rescued: true,
        rescueReason: 'list_to_total_earnings',
      };
    }

    if (
      (action === 'list_employees' ||
        action === 'list_bookings' ||
        action === 'show_appointments') &&
      isTopStaffRevenuePrompt(prompt)
    ) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning: 'Specialist/provider revenue ranking query.',
        rescued: true,
        rescueReason: 'list_to_top_staff_revenue',
      };
    }

    if (
      READ_ONLY_ACTIONS.has(action) &&
      isClearSchedulePrompt(prompt) &&
      action !== 'clear_schedule'
    ) {
      return {
        action: 'clear_schedule',
        params,
        reasoning: 'Clear schedule operation detected.',
        rescued: true,
        rescueReason: 'read_to_clear_schedule',
      };
    }

    if (action === 'unknown') {
      return this.rescue({ prompt, action, params, employees });
    }

    return null;
  }
}
