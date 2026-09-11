import { resolveServicesVerdict } from './ai-orchestration.helpers.js';
import type { CommandResult } from './command-completion.types.js';
import type { NamedResolver } from './ai-name-resolution.types.js';
import type { AiBookingDepthService } from './ai-booking-depth.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { Business } from '../business/entities/business.entity.js';

export type BookingDepthDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt: string;
  userId?: string;
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  timeZone: string;
  sessionDate?: string;
  calendarRoute?: string;
  resolveEmployee: NamedResolver<Employee>;
  resolveServices: (list: Service[], p: Record<string, any>) => Service[];
  resolveCustomer: NamedResolver<Customer>;
  resolveBusinessRow: () => Promise<Business | null>;
};

export type BookingDepthDispatchHandler = (
  service: AiBookingDepthService,
  ctx: BookingDepthDispatchContext,
) => Promise<CommandResult>;

export function buildBookingDepthDispatchMap(): ReadonlyMap<
  string,
  BookingDepthDispatchHandler
> {
  const map = new Map<string, BookingDepthDispatchHandler>();

  map.set('cancel_package_visit', async (service, ctx) =>
    service.handleCancelPackageVisit(ctx.businessId, ctx.params, ctx.userId),
  );
  map.set('cancel_multi_service_group', async (service, ctx) =>
    service.handleCancelMultiServiceGroup(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('reschedule_package_visit', async (service, ctx) =>
    service.handleReschedulePackageVisit(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('reschedule_multi_service_group', async (service, ctx) =>
    service.handleRescheduleMultiServiceGroup(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('list_cash_pending_bookings', async (service, ctx) =>
    service.handleListCashPending(ctx.businessId, ctx.prompt, ctx.params),
  );
  map.set('list_package_bookings', async (service, ctx) =>
    service.handleListPackageBookings(ctx.businessId, ctx.prompt, ctx.params),
  );
  map.set('list_multi_service_bookings', async (service, ctx) =>
    service.handleListMultiServiceBookings(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
    ),
  );
  map.set('mark_paid', async (service, ctx) =>
    service.handleMarkPaid(
      ctx.businessId,
      { ...ctx.params, _timeZone: ctx.timeZone },
      ctx.userId,
      {
        prompt: ctx.prompt,
        employees: ctx.employees,
        customers: ctx.customers,
        timeZone: ctx.timeZone,
        sessionDate: ctx.sessionDate,
        calendarRoute: ctx.calendarRoute,
      },
    ),
  );
  map.set('assign_booking_resource', async (service, ctx) =>
    service.handleAssignResource(ctx.businessId, ctx.params, ctx.userId),
  );
  map.set('explain_booking_policy', async (service, ctx) =>
    service.handleExplainPolicy(ctx.businessId, ctx.params),
  );

  map.set('create_package_booking', async (service, ctx) => {
    const businessRow = await ctx.resolveBusinessRow();
    if (!businessRow) {
      return {
        success: false,
        action: 'create_package_booking',
        summary: 'Business not found',
        details: {},
      };
    }
    return service.handleCreatePackageBooking(
      ctx.businessId,
      ctx.params,
      businessRow,
      ctx.employees,
      ctx.services,
      ctx.customers,
      ctx.resolveEmployee,
      ctx.resolveCustomer,
      ctx.userId,
    );
  });
  map.set('create_multi_service_booking', async (service, ctx) => {
    const businessRow = await ctx.resolveBusinessRow();
    if (!businessRow) {
      return {
        success: false,
        action: 'create_multi_service_booking',
        summary: 'Business not found',
        details: {},
      };
    }
    // D5 / §238 — `handleCreateMultiServiceBookingLogic` receives
    // `resolveServices` as an injected callback, which the tracker classed as
    // "one contract change, not a migration". It is not: the callback's
    // *injection site* is here, and this dispatch entry already returns
    // `CommandResult` (see the "Business not found" refusal above). So the tie
    // can be refused without touching the callee's signature — the same
    // caller-not-helper rule as §225/§228/§234/§235.
    const serviceVerdict = resolveServicesVerdict(ctx.services, ctx.params);
    if (serviceVerdict.ambiguous) {
      return {
        success: false,
        action: 'create_multi_service_booking',
        summary: serviceVerdict.ambiguous.clarification,
        details: {
          clarify: true,
          requestedName: serviceVerdict.ambiguous.requestedName,
          candidates: serviceVerdict.ambiguous.candidates,
        },
      };
    }
    return service.handleCreateMultiServiceBooking(
      ctx.businessId,
      ctx.params,
      businessRow,
      ctx.employees,
      ctx.services,
      ctx.customers,
      ctx.resolveEmployee,
      ctx.resolveServices,
      ctx.resolveCustomer,
      ctx.userId,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiBookingDepthService (ai-cmd-ext-0.5). */
export const BOOKING_DEPTH_DISPATCH_MAP = buildBookingDepthDispatchMap();
