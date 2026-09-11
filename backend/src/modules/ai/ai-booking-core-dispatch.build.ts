import type { CommandResult } from './command-completion.types.js';
import type { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';

export type BookingCoreDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt: string;
  userId?: string;
  employeeId?: string;
  resolvedEmployeeName?: string;
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  templates: ScheduleTemplate[];
  timeZone: string;
  lookupCustomerAccessContext?: string;
};

export type BookingCoreDispatchHandler = (
  service: AiBookingCoreService,
  ctx: BookingCoreDispatchContext,
) => Promise<CommandResult>;

export function buildBookingCoreDispatchMap(): ReadonlyMap<
  string,
  BookingCoreDispatchHandler
> {
  const map = new Map<string, BookingCoreDispatchHandler>();

  map.set('create_booking', async (service, ctx) =>
    service.handleCreateBooking(
      ctx.businessId,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.customers,
      ctx.userId,
      ctx.prompt,
    ),
  );

  const handleListBookingsEntry: BookingCoreDispatchHandler = async (
    service,
    ctx,
  ) =>
    service.handleListBookings(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employeeId,
      ctx.resolvedEmployeeName,
      ctx.services,
    );
  map.set('list_bookings', handleListBookingsEntry);
  map.set('show_appointments', handleListBookingsEntry);

  map.set('check_availability', async (service, ctx) =>
    service.handleCheckAvailability(
      ctx.businessId,
      ctx.params,
      ctx.employeeId,
      ctx.resolvedEmployeeName,
      ctx.prompt,
    ),
  );
  map.set('summarize_day', async (service, ctx) =>
    service.handleSummarizeDay(
      ctx.businessId,
      ctx.params,
      ctx.employeeId,
      ctx.resolvedEmployeeName,
    ),
  );
  map.set('summarize_bookings', async (service, ctx) =>
    service.handleSummarizeBookings(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employeeId,
      ctx.resolvedEmployeeName,
    ),
  );
  map.set('analyze_appointments', async (service, ctx) =>
    service.handleAnalyzeAppointments(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employeeId,
      ctx.resolvedEmployeeName,
    ),
  );
  map.set('list_services', async (service, ctx) =>
    service.handleListServices(
      ctx.businessId,
      ctx.services,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('analyze_services', async (service, ctx) =>
    service.handleAnalyzeServices(ctx.businessId, ctx.prompt, ctx.params),
  );
  map.set('summarize_staff', async (service, ctx) =>
    service.handleSummarizeStaff(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
    ),
  );
  map.set('lookup_customer', async (service, ctx) =>
    service.handleLookupCustomer(
      ctx.businessId,
      ctx.params,
      ctx.customers,
      ctx.lookupCustomerAccessContext,
    ),
  );
  map.set('summarize_waitlist', async (service, ctx) =>
    service.handleSummarizeWaitlist(ctx.businessId, ctx.params),
  );
  map.set('lookup_service_assignment', async (service, ctx) =>
    service.handleLookupServiceAssignment(
      ctx.businessId,
      ctx.employees,
      ctx.services,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('list_employees', async (service, ctx) =>
    service.handleListEmployees(ctx.employees, ctx.params),
  );
  map.set('list_templates', async (service, ctx) =>
    service.handleListTemplates(ctx.templates),
  );
  map.set('mark_no_shows', async (service, ctx) =>
    service.handleMarkNoShows(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('no_show_recovery', async (service, ctx) =>
    service.handleNoShowRecovery(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('payment_sweep', async (service, ctx) =>
    service.handlePaymentSweep(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('update_bookings', async (service, ctx) =>
    service.handleUpdateBookings(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.customers,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('day_replan', async (service, ctx) =>
    service.handleDayReplan(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.timeZone,
      ctx.userId,
    ),
  );
  map.set('assign_employee_services', async (service, ctx) =>
    service.handleAssignEmployeeServices(
      ctx.businessId,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('unassign_employee_services', async (service, ctx) =>
    service.handleUnassignEmployeeServices(
      ctx.businessId,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('transfer_employee_services', async (service, ctx) =>
    service.handleTransferEmployeeServices(
      ctx.businessId,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('summarize_utilization', async (service, ctx) =>
    service.handleSummarizeUtilization(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
    ),
  );
  map.set('summarize_customers', async (service, ctx) =>
    service.handleSummarizeCustomers(ctx.businessId, ctx.prompt, ctx.params),
  );
  map.set('reschedule_booking', async (service, ctx) =>
    service.handleRescheduleBooking(
      ctx.businessId,
      ctx.params,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('bulk_smart_cancel', async (service, ctx) =>
    service.handleBulkSmartCancel(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('hide_appointments_from_calendar', async (service, ctx) =>
    service.handleHideAppointmentsFromCalendar(
      ctx.businessId,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.customers,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('unhide_appointments_from_calendar', async (service, ctx) =>
    service.handleUnhideAppointmentsFromCalendar(
      ctx.businessId,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.customers,
      ctx.employeeId,
      ctx.userId,
    ),
  );
  map.set('fill_slot_from_waitlist', async (service, ctx) =>
    service.handleFillSlotFromWaitlist(
      ctx.businessId,
      ctx.params,
      ctx.employeeId,
      ctx.userId,
    ),
  );

  /** Shape-C branching preserved verbatim from the switch (ai-cmd-ext-0.5). */
  map.set('cancel_bookings', async (service, ctx) => {
    const notifyIntent =
      /notify|waitlist|rebook|whatsapp|message|customer|text/i.test(
        ctx.prompt,
      ) ||
      Boolean(ctx.params.notifyCustomers) ||
      Boolean(ctx.params.reason);
    if (notifyIntent) {
      return service.handleBulkSmartCancel(
        ctx.businessId,
        ctx.prompt,
        ctx.params,
        ctx.services,
        ctx.employees,
        ctx.employeeId,
        ctx.userId,
        { notifyOnly: !/waitlist|rebook/i.test(ctx.prompt) },
      );
    }
    return service.handleCancelBookings(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.employees,
      ctx.customers,
      ctx.employeeId,
      ctx.userId,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiBookingCoreService (ai-cmd-ext-0.5). */
export const BOOKING_CORE_DISPATCH_MAP = buildBookingCoreDispatchMap();
