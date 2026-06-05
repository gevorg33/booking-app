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
  isTeamWideProviderAvailabilityQuery,
  extractStatusFiltersFromPrompt,
  isBulkAllAppointmentsPrompt,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
} from './ai-intent-heuristics.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { isCapacityRebalancePrompt, rescueSprint23Intent } from './ai-sprint23.util.js';
import { rescueSprint24Intent } from './ai-sprint24.util.js';

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
]);

@Injectable()
export class AiIntentRescueService {
  rescue(input: IntentRescueInput): IntentRescueResult | null {
    const { prompt, employees = [] } = input;
    let { action, params, reasoning } = input;

    if (action !== 'unknown') {
      const disambiguated = this.disambiguateMisclassified(prompt, action, params, employees);
      if (disambiguated) return disambiguated;
      const sprint23 = this.tryRescueSprint23(prompt, action, params);
      if (sprint23) return sprint23;
      const sprint24 = this.tryRescueSprint24(prompt, action, params);
      if (sprint24) return sprint24;
      return null;
    }

    const sprint23Unknown = this.tryRescueSprint23(prompt, action, params);
    if (sprint23Unknown) return sprint23Unknown;
    const sprint24Unknown = this.tryRescueSprint24(prompt, action, params);
    if (sprint24Unknown) return sprint24Unknown;

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
        reasoning: 'Create a reusable schedule template from the described hours.',
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

    if (/\b(payment sweep|unpaid|collect payment|outstanding payment)/i.test(prompt)) {
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
            assignmentLookup: params.assignmentLookup ?? 'providers_for_service',
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
      if (status && status !== BookingStatus.CANCELLED) rescuedParams.status = status;
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

    if (/\b(hide|remove from calendar)\b/i.test(prompt) && !/\bcancel\b/i.test(prompt)) {
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

  private tryRescueSprint23(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const rescued = rescueSprint23Intent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged = JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'sprint23_scheduling',
    };
  }

  private tryRescueSprint24(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const rescued = rescueSprint24Intent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged = JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'sprint24_booking_ops',
    };
  }

  private disambiguateMisclassified(
    prompt: string,
    action: string,
    params: Record<string, any>,
    employees: Array<{ id: string; name: string }>,
  ): IntentRescueResult | null {
    const sprint23 = this.tryRescueSprint23(prompt, action, params);
    if (sprint23) return sprint23;
    const sprint24 = this.tryRescueSprint24(prompt, action, params);
    if (sprint24) return sprint24;

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
      (isTeamWideProviderAvailabilityQuery(prompt) ||
        /\b(who (?:can|is|has)|which provider|schedule today at)\b/i.test(lower)) &&
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
