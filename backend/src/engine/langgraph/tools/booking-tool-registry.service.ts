import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentToolBridgeService } from '../services/agent-tool-bridge.service.js';
import { BookingSlotResolverService } from '../../../modules/booking/booking-slot-resolver.service.js';
import { toIsoDay } from '../../../common/utils/date-format.util.js';
import type { BookingToolRunContext } from './booking-tool.types.js';
import {
  buildDateParams,
  bookingIdsSchema,
  compoundStepSchema,
  dateRangeSchema,
  directSchedulePeriodSchema,
  employeeIdsSchema,
  employeeSchema,
  serviceCreateSchema,
} from './booking-tool-schemas.js';
import {
  priorStepId,
  proposeManySteps,
  proposeStep,
  resolveEmployeeLabel,
  runReadTool,
  withResolvedEmployeeParams,
  buildDirectScheduleProposalSteps,
} from './booking-tool-context.helpers.js';

@Injectable()
export class BookingToolRegistryService {
  constructor(
    private readonly toolBridge: AgentToolBridgeService,
    private readonly slotResolver: BookingSlotResolverService,
  ) {}

  createTools(ctx: BookingToolRunContext): StructuredToolInterface[] {
    return [...this.createReadTools(ctx), ...this.createProposeTools(ctx)];
  }

  private createReadTools(ctx: BookingToolRunContext): StructuredToolInterface[] {
    const read = (action: string, params: Record<string, unknown>, dependsOn: string[] = []) =>
      runReadTool(ctx, this.toolBridge, action, params, dependsOn);

    return [
      tool(
        async (input) =>
          read('list_appointments', { ...buildDateParams(input), employeeId: input.employeeId }),
        {
          name: 'list_appointments',
          description: 'List appointments/bookings for a date or range. Read-only.',
          schema: dateRangeSchema.extend({ employeeId: z.string().optional() }),
        },
      ),
      tool(
        async (input) =>
          read('fetch_current_schedule', {
            ...buildDateParams(input),
            employeeId: input.employeeId,
          }),
        {
          name: 'fetch_current_schedule',
          description: 'Fetch schedule blocks and bookings for provider(s). Read-only.',
          schema: dateRangeSchema.extend({ employeeId: z.string().optional() }),
        },
      ),
      tool(
        async (input) => read('analyze_utilization', buildDateParams(input)),
        {
          name: 'analyze_utilization',
          description: 'Per-provider utilization for a date range. Read-only.',
          schema: dateRangeSchema,
        },
      ),
      tool(
        async (input) => read('summarize_utilization', buildDateParams(input)),
        {
          name: 'summarize_utilization',
          description: 'Summarized utilization report. Read-only.',
          schema: dateRangeSchema,
        },
      ),
      tool(
        async (input) =>
          read('identify_schedule_gaps', {
            ...buildDateParams(input),
            minUtilizationThreshold: input.minUtilizationThreshold ?? 0.6,
          }),
        {
          name: 'identify_schedule_gaps',
          description: 'Find underutilized providers/blocks. Read-only.',
          schema: dateRangeSchema.extend({
            minUtilizationThreshold: z.number().min(0).max(1).optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          read(
            'generate_optimization_recommendations',
            { optimizationGoal: input.optimizationGoal ?? 'fill gaps' },
            priorStepId(ctx, 'identify_schedule_gaps'),
          ),
        {
          name: 'generate_optimization_recommendations',
          description: 'Recommendations after identify_schedule_gaps. Read-only.',
          schema: z.object({ optimizationGoal: z.string().optional() }),
        },
      ),
      tool(
        async (input) => read('find_freed_slots', buildDateParams(input)),
        {
          name: 'find_freed_slots',
          description: 'Slots freed by cancelled appointments. Read-only.',
          schema: dateRangeSchema,
        },
      ),
      tool(
        async (input) =>
          read('find_rebooking_candidates', buildDateParams(input), priorStepId(ctx, 'find_freed_slots')),
        {
          name: 'find_rebooking_candidates',
          description: 'Waitlist/rebooking candidates. Call find_freed_slots first. Read-only.',
          schema: dateRangeSchema,
        },
      ),
      tool(
        async (input) => read('detect_conflicts', buildDateParams(input)),
        {
          name: 'detect_conflicts',
          description: 'Overlapping bookings / schedule conflicts. Read-only.',
          schema: dateRangeSchema,
        },
      ),
      tool(
        async (input) =>
          read(
            'analyze_resolution_options',
            {
              strategies: input.strategies ?? [
                'reschedule',
                'reassign_employee',
                'cancel_lower_priority',
              ],
            },
            priorStepId(ctx, 'detect_conflicts'),
          ),
        {
          name: 'analyze_resolution_options',
          description: 'Resolution strategies per conflict. Call detect_conflicts first. Read-only.',
          schema: z.object({ strategies: z.array(z.string()).optional() }),
        },
      ),
      tool(
        async (input) => {
          const dateParams = buildDateParams(input);
          const isoDay = (dateParams.date ?? dateParams.dateFrom) as string | undefined;
          if (!isoDay || !input.timeSlot) {
            return JSON.stringify({ error: 'date and timeSlot are required' });
          }

          const employee =
            ctx.employees.find((e) => e.id === input.employeeId) ??
            ctx.employees.find((e) =>
              input.employeeName
                ? e.name.toLowerCase().includes(input.employeeName.toLowerCase())
                : false,
            );
          const service =
            ctx.services.find((s) => s.id === input.serviceId) ??
            ctx.services.find((s) =>
              s.name.toLowerCase().includes(input.serviceName.toLowerCase()),
            );

          if (!employee || !service) {
            return JSON.stringify({ error: 'Unknown employee or service' });
          }

          const check = await this.slotResolver.checkSlotAvailability(
            ctx.businessId,
            employee.id,
            employee.name,
            service.id,
            toIsoDay(isoDay, ctx.timeZone),
            input.timeSlot,
            ctx.timeZone,
          );
          return JSON.stringify(check);
        },
        {
          name: 'check_slot_availability',
          description:
            'Check whether a provider can take a service at a fixed date and time. Read-only.',
          schema: dateRangeSchema.extend({
            employeeId: z.string().optional(),
            employeeName: z.string().optional(),
            serviceId: z.string().optional(),
            serviceName: z.string(),
            timeSlot: z.string(),
          }),
        },
      ),
      tool(
        async (input) => {
          const dateParams = buildDateParams(input);
          const isoDay = (dateParams.date ?? dateParams.dateFrom) as string | undefined;
          if (!isoDay) {
            return JSON.stringify({ error: 'date is required' });
          }

          const employee =
            ctx.employees.find((e) => e.id === input.employeeId) ??
            ctx.employees.find((e) =>
              input.employeeName
                ? e.name.toLowerCase().includes(input.employeeName.toLowerCase())
                : false,
            );
          const service =
            ctx.services.find((s) => s.id === input.serviceId) ??
            ctx.services.find((s) =>
              s.name.toLowerCase().includes(input.serviceName.toLowerCase()),
            );

          if (!employee || !service) {
            return JSON.stringify({ error: 'Unknown employee or service' });
          }

          const pick = await this.slotResolver.findFirstAvailableSlot(
            ctx.businessId,
            employee.id,
            employee.name,
            service.id,
            toIsoDay(isoDay, ctx.timeZone),
            ctx.timeZone,
            input.notBeforeTime ?? null,
            input.maxDays ?? 1,
          );

          return JSON.stringify(
            pick ?? {
              available: false,
              employeeName: employee.name,
              serviceName: service.name,
              isoDay: toIsoDay(isoDay, ctx.timeZone),
            },
          );
        },
        {
          name: 'find_first_available_slot',
          description:
            'Find the earliest open bookable slot for a provider/service on a day (or small day range). Use for reschedule to nearest free time — NOT check_slot_availability.',
          schema: dateRangeSchema.extend({
            employeeId: z.string().optional(),
            employeeName: z.string().optional(),
            serviceId: z.string().optional(),
            serviceName: z.string(),
            notBeforeTime: z.string().optional(),
            maxDays: z.number().min(1).max(14).optional(),
          }),
        },
      ),
    ];
  }

  private createProposeTools(ctx: BookingToolRunContext): StructuredToolInterface[] {
    const propose = (
      action: string,
      description: string,
      params: Record<string, unknown>,
      opts?: { dependsOn?: string[]; chainPrevious?: boolean },
    ) => proposeStep(ctx, action, description, params, opts);

    return [
      // ── Bookings ──
      tool(
        async (input) =>
          propose(
            'cancel_bookings',
            `Cancel ${input.bookingIds.length} booking(s)`,
            {
              bookingIds: input.bookingIds,
              reason: input.reason ?? 'Cancelled via AI agent',
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_cancel_bookings',
          description: 'PROPOSE bulk cancel by booking IDs (approval required).',
          schema: bookingIdsSchema.extend({
            reason: z.string().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) => {
          const cancelId = crypto.randomUUID();
          const notifyId = crypto.randomUUID();
          const freedId = crypto.randomUUID();
          const candidatesId = crypto.randomUUID();
          const proposalsId = crypto.randomUUID();
          const reason = input.reason ?? 'Cancelled via AI agent';
          const dateParams = buildDateParams(input);

          ctx.proposals.push(
            {
              id: cancelId,
              action: 'cancel_bookings',
              description: `Cancel ${input.bookingIds.length} booking(s)`,
              params: {
                businessId: ctx.businessId,
                bookingIds: input.bookingIds,
                reason,
                userId: ctx.userId,
              },
              dependsOn: [],
              estimatedImpact: 'Requires approval',
            },
            {
              id: notifyId,
              action: 'notify_cancelled_customers',
              description: 'Notify customers about cancellation',
              params: { businessId: ctx.businessId, bookingIds: input.bookingIds, reason },
              dependsOn: [cancelId],
              estimatedImpact: 'Requires approval',
            },
            {
              id: freedId,
              action: 'find_freed_slots',
              description: 'Find freed slots from cancellations',
              params: { businessId: ctx.businessId, ...dateParams },
              dependsOn: [cancelId],
              estimatedImpact: 'Discovery step in plan',
            },
            {
              id: candidatesId,
              action: 'find_rebooking_candidates',
              description: 'Find rebooking candidates',
              params: { businessId: ctx.businessId, ...dateParams },
              dependsOn: [freedId],
              estimatedImpact: 'Discovery step in plan',
            },
            {
              id: proposalsId,
              action: 'propose_reassignment',
              description: 'Propose waitlist reassignments',
              params: { businessId: ctx.businessId },
              dependsOn: [candidatesId],
              estimatedImpact: 'Requires approval',
            },
          );

          return JSON.stringify({
            status: 'proposed_bulk_smart_cancel',
            totalProposedSteps: ctx.proposals.length,
            message: 'Proposed: cancel → notify → recovery pipeline.',
          });
        },
        {
          name: 'propose_bulk_smart_cancel',
          description:
            'PROPOSE cancel + notify + waitlist recovery as one chained approval plan.',
          schema: bookingIdsSchema.merge(dateRangeSchema).extend({ reason: z.string().optional() }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'reschedule_booking',
            `Reschedule booking ${input.bookingId}`,
            {
              bookingId: input.bookingId,
              newStartTime: input.newStartTime,
              employeeId: input.employeeId,
              userId: ctx.userId,
              notes: input.notes,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_reschedule_booking',
          description: 'PROPOSE moving one booking to a new time.',
          schema: z.object({
            bookingId: z.string(),
            newStartTime: z.string().describe('ISO datetime for new slot'),
            employeeId: z.string().optional(),
            notes: z.string().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          proposeManySteps(
            ctx,
            input.bookings.map((b) => ({
              action: 'reschedule_booking',
              description: `Reschedule booking ${b.bookingId}`,
              params: {
                bookingId: b.bookingId,
                newStartTime: b.newStartTime,
                employeeId: b.employeeId,
                userId: ctx.userId,
              },
              chainPrevious: false,
            })),
          ),
        {
          name: 'propose_reschedule_bookings_bulk',
          description: 'PROPOSE rescheduling multiple bookings (parallel steps).',
          schema: z.object({
            bookings: z
              .array(
                z.object({
                  bookingId: z.string(),
                  newStartTime: z.string(),
                  employeeId: z.string().optional(),
                }),
              )
              .min(1)
              .max(20),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'create_booking',
            `Book ${input.serviceName} with ${input.employeeName}`,
            {
              employeeId: input.employeeId,
              serviceId: input.serviceId,
              customerId: input.customerId,
              startTime: input.startTime,
              notes: input.notes,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_create_booking',
          description: 'PROPOSE a new appointment.',
          schema: z.object({
            employeeId: z.string(),
            employeeName: z.string(),
            serviceId: z.string(),
            serviceName: z.string(),
            startTime: z.string(),
            customerId: z.string().optional(),
            notes: z.string().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) => {
          const dateParams = buildDateParams(input);
          const isoDay = (dateParams.date ?? dateParams.dateFrom) as string | undefined;
          if (!isoDay) {
            return JSON.stringify({ error: 'date is required' });
          }

          const service =
            ctx.services.find((s) => s.id === input.serviceId) ??
            ctx.services.find((s) =>
              s.name.toLowerCase().includes(input.serviceName.toLowerCase()),
            );
          if (!service) {
            return JSON.stringify({ error: 'Unknown service' });
          }

          const providerPriority = input.providerFallbackNames
            .map((name) => {
              const match = ctx.employees.find((e) =>
                e.name.toLowerCase().includes(name.toLowerCase()),
              );
              return match ? { id: match.id, name: match.name } : null;
            })
            .filter((p): p is { id: string; name: string } => !!p);

          const pick = await this.slotResolver.resolveWithFallback({
            businessId: ctx.businessId,
            serviceId: service.id,
            isoDay: toIsoDay(isoDay, ctx.timeZone),
            timeSlot: input.timeSlot,
            timeZone: ctx.timeZone,
            providerPriority,
            fallbackAnyProvider: input.fallbackAnyProvider ?? false,
            allActiveProviders: ctx.employees,
          });

          if (!pick) {
            return JSON.stringify({
              status: 'no_availability',
              message: `No provider available for ${service.name} at ${input.timeSlot} on ${isoDay}`,
              triedProviders: providerPriority.map((p) => p.name),
              fallbackAnyProvider: input.fallbackAnyProvider ?? false,
            });
          }

          return propose(
            'create_booking',
            `Book ${service.name} with ${pick.employeeName} at ${pick.timeSlot} (${pick.matchReason})`,
            {
              employeeId: pick.employeeId,
              serviceId: pick.serviceId,
              startTime: pick.startTime,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          );
        },
        {
          name: 'propose_book_with_fallback',
          description:
            'PROPOSE booking at a fixed time with ordered provider fallback (e.g. Gevorg, then Mary, then whoever is free). Resolves availability before proposing.',
          schema: dateRangeSchema.extend({
            serviceId: z.string().optional(),
            serviceName: z.string(),
            timeSlot: z.string(),
            providerFallbackNames: z.array(z.string()).min(1).max(10),
            fallbackAnyProvider: z.boolean().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          proposeManySteps(
            ctx,
            input.bookings.map((b) => ({
              action: 'create_booking',
              description: `Book ${b.serviceName} with ${b.employeeName}`,
              params: {
                employeeId: b.employeeId,
                serviceId: b.serviceId,
                customerId: b.customerId,
                startTime: b.startTime,
                notes: b.notes,
                userId: ctx.userId,
              },
              chainPrevious: false,
            })),
          ),
        {
          name: 'propose_create_bookings_bulk',
          description: 'PROPOSE multiple new bookings at once.',
          schema: z.object({
            bookings: z
              .array(
                z.object({
                  employeeId: z.string(),
                  employeeName: z.string(),
                  serviceId: z.string(),
                  serviceName: z.string(),
                  startTime: z.string(),
                  customerId: z.string().optional(),
                  notes: z.string().optional(),
                }),
              )
              .min(1)
              .max(20),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'execute_reassignment',
            `Rebook slot for customer ${input.customerId}`,
            {
              bookingId: input.bookingId,
              customerId: input.customerId,
              employeeId: input.employeeId,
              serviceId: input.serviceId,
              startTime: input.startTime,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? true },
          ),
        {
          name: 'propose_execute_reassignment',
          description: 'PROPOSE filling a freed slot with a specific customer.',
          schema: z.object({
            bookingId: z.string().optional(),
            customerId: z.string(),
            employeeId: z.string(),
            serviceId: z.string(),
            startTime: z.string(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'hide_appointments_from_calendar',
            `Hide ${input.bookingIds.length} appointment(s)`,
            { bookingIds: input.bookingIds, userId: ctx.userId },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_hide_appointments',
          description: 'PROPOSE hide from calendar (not delete). chainPrevious=true after cancel.',
          schema: bookingIdsSchema.extend({ chainPrevious: z.boolean().optional() }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'unhide_appointments_from_calendar',
            `Restore ${input.bookingIds.length} hidden appointment(s)`,
            { bookingIds: input.bookingIds, userId: ctx.userId },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_unhide_appointments',
          description: 'PROPOSE restore hidden appointments to calendar.',
          schema: bookingIdsSchema.extend({ chainPrevious: z.boolean().optional() }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'notify_cancelled_customers',
            `Notify ${input.bookingIds.length} customer(s)`,
            { bookingIds: input.bookingIds, reason: input.reason ?? 'Update from salon' },
            { chainPrevious: input.chainPrevious ?? true },
          ),
        {
          name: 'propose_notify_customers',
          description: 'PROPOSE send cancellation/update notifications.',
          schema: bookingIdsSchema.extend({
            reason: z.string().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),

      // ── Schedule ──
      tool(
        async (input) =>
          propose(
            'clear_schedule',
            `Clear schedule for ${resolveEmployeeLabel(ctx, input.employeeId, input.employeeName)}`,
            withResolvedEmployeeParams(ctx, {
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              ...buildDateParams(input),
              userId: ctx.userId,
            }),
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_clear_schedule',
          description: 'PROPOSE clear applied schedule periods (not bookings).',
          schema: dateRangeSchema.merge(employeeSchema).extend({
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          proposeManySteps(
            ctx,
            input.providers.map((p, i) => {
              const label = resolveEmployeeLabel(ctx, p.employeeId, p.employeeName);
              return {
              action: 'clear_schedule',
              description: `Clear schedule for ${label}`,
              params: withResolvedEmployeeParams(ctx, {
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                ...buildDateParams(input),
                userId: ctx.userId,
              }),
              chainPrevious: i > 0 && (input.chainSteps ?? false),
            };
            }),
          ),
        {
          name: 'propose_clear_schedules_bulk',
          description: 'PROPOSE clear schedules for multiple providers.',
          schema: dateRangeSchema.extend({
            providers: z.array(employeeSchema).min(1).max(15),
            chainSteps: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'apply_template',
            `Apply template ${input.templateName ?? input.templateId}`,
            {
              templateId: input.templateId,
              templateName: input.templateName,
              employeeIds: input.employeeIds,
              startDate: input.dateFrom ?? input.date,
              endDate: input.dateTo ?? input.date,
              applyDays: input.applyDays,
              repeatWeeksCount: input.repeatWeeksCount ?? 1,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_apply_schedule',
          description: 'PROPOSE apply a schedule template to provider(s).',
          schema: dateRangeSchema.merge(employeeIdsSchema).extend({
            templateId: z.string(),
            templateName: z.string().optional(),
            applyDays: z.array(z.number().min(0).max(6)).optional(),
            repeatWeeksCount: z.number().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) => {
          try {
            const steps = buildDirectScheduleProposalSteps(ctx, input, {
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              periods: input.periods,
            }, { chainSteps: input.chainPrevious ?? false });
            return proposeManySteps(ctx, steps);
          } catch (err: any) {
            return JSON.stringify({
              error: err?.message ?? 'Failed to propose direct schedule',
            });
          }
        },
        {
          name: 'propose_create_direct_schedule',
          description: 'PROPOSE set/replace provider schedule blocks for day(s).',
          schema: dateRangeSchema.merge(employeeSchema).extend({
            dates: z.array(z.string()).optional(),
            periods: z.array(directSchedulePeriodSchema).optional(),
            timeFrom: z.string().optional(),
            timeTo: z.string().optional(),
            scheduleHint: z.string().optional().describe('Optional NL hint for hours/lunch, e.g. 9-19 with 12-13 unavailable'),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) => {
          try {
            const steps = input.providers.flatMap((p) =>
              buildDirectScheduleProposalSteps(ctx, input, {
                employeeId: p.employeeId,
                employeeName: p.employeeName,
                periods: p.periods ?? input.periods,
              }),
            );
            const chained = steps.map((step, index) => ({
              ...step,
              chainPrevious: index > 0 && (input.chainSteps ?? false),
            }));
            return proposeManySteps(ctx, chained);
          } catch (err: any) {
            return JSON.stringify({
              error: err?.message ?? 'Failed to propose direct schedules',
            });
          }
        },
        {
          name: 'propose_create_direct_schedules_bulk',
          description: 'PROPOSE direct schedules for multiple providers (e.g. whole team 9-19).',
          schema: dateRangeSchema.extend({
            dates: z.array(z.string()).optional(),
            periods: z.array(directSchedulePeriodSchema).optional(),
            timeFrom: z.string().optional(),
            timeTo: z.string().optional(),
            scheduleHint: z.string().optional(),
            providers: z
              .array(
                employeeSchema.extend({
                  periods: z.array(directSchedulePeriodSchema).optional(),
                }),
              )
              .min(1)
              .max(15),
            chainSteps: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'create_block_schedule',
            `Block time for ${resolveEmployeeLabel(ctx, input.employeeId, input.employeeName)}`,
            withResolvedEmployeeParams(ctx, {
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              startTime: input.startTime,
              endTime: input.endTime,
              blockFullDay: input.blockFullDay,
              userId: ctx.userId,
              ...buildDateParams(input),
            }),
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_block_schedule',
          description: 'PROPOSE block time or full day for a provider.',
          schema: dateRangeSchema.merge(employeeSchema).extend({
            startTime: z.string().optional(),
            endTime: z.string().optional(),
            blockFullDay: z.boolean().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'fill_schedule_gaps',
            `Fill schedule gaps for ${resolveEmployeeLabel(ctx, input.employeeId, input.employeeName)}`,
            withResolvedEmployeeParams(ctx, {
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              periods: input.periods,
              userId: ctx.userId,
            }),
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_fill_schedule_gaps',
          description: 'PROPOSE create service periods in open slots.',
          schema: employeeSchema.extend({
            periods: z.array(z.record(z.string(), z.unknown())).optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),

      // ── Templates / operational sweeps ──
      tool(
        async (input) =>
          propose(
            'create_schedule_template',
            `Create schedule template "${input.templateName}"`,
            {
              templateName: input.templateName,
              name: input.templateName,
              periods: input.periods,
              timeFrom: input.timeFrom,
              timeTo: input.timeTo,
              applyDays: input.applyDays,
              serviceNames: input.serviceNames,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_create_schedule_template',
          description:
            'PROPOSE create a reusable schedule template (name, hours, weekday flags, optional services).',
          schema: z.object({
            templateName: z.string().min(1),
            periods: z.array(z.record(z.string(), z.unknown())).optional(),
            timeFrom: z.string().optional(),
            timeTo: z.string().optional(),
            applyDays: z.array(z.number().min(0).max(6)).optional(),
            serviceNames: z.array(z.string()).optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'mark_no_shows',
            `Mark no-shows${input.date ? ` for ${input.date}` : ''}`,
            {
              ...buildDateParams(input),
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              customerName: input.customerName,
              timeSlot: input.timeSlot,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_mark_no_shows',
          description:
            'PROPOSE mark past missed appointments as no-show for a date or range (approval required).',
          schema: dateRangeSchema.merge(employeeSchema).extend({
            customerName: z.string().optional(),
            timeSlot: z.string().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'payment_sweep',
            `Payment sweep${input.date ? ` for ${input.date}` : ''}`,
            {
              ...buildDateParams(input),
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_payment_sweep',
          description:
            'PROPOSE mark unpaid completed/in-progress appointments as paid for a date or range.',
          schema: dateRangeSchema.merge(employeeSchema).extend({
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'day_replan',
            `Replan day${input.date ? ` for ${input.date}` : ''}`,
            {
              ...buildDateParams(input),
              employeeIds: input.employeeIds,
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              userId: ctx.userId,
            },
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_day_replan',
          description:
            'PROPOSE analyze and replan a day — conflicts, gaps, recommendations (approval for mutations).',
          schema: dateRangeSchema.merge(employeeIdsSchema).merge(employeeSchema).extend({
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),

      // ── Catalog / assignment ──
      tool(
        async (input) =>
          propose(
            'create_service',
            `Add service "${input.name}"`,
            {
              name: input.name,
              description: input.description,
              durationMinutes: input.durationMinutes,
              bufferMinutes: input.bufferMinutes ?? 0,
              price: input.price,
              currency: input.currency ?? 'USD',
              userId: ctx.userId,
            },
            { chainPrevious: false },
          ),
        {
          name: 'propose_create_service',
          description: 'PROPOSE add one service to catalog.',
          schema: serviceCreateSchema,
        },
      ),
      tool(
        async (input) =>
          proposeManySteps(
            ctx,
            input.services.map((s) => ({
              action: 'create_service',
              description: `Add service "${s.name}"`,
              params: {
                name: s.name,
                description: s.description,
                durationMinutes: s.durationMinutes,
                bufferMinutes: s.bufferMinutes ?? 0,
                price: s.price,
                currency: s.currency ?? 'USD',
                userId: ctx.userId,
              },
              chainPrevious: false,
            })),
          ),
        {
          name: 'propose_create_services_bulk',
          description: 'PROPOSE add multiple services to catalog at once.',
          schema: z.object({
            services: z.array(serviceCreateSchema).min(1).max(25),
          }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'assign_employee_services',
            `Assign services to ${resolveEmployeeLabel(ctx, input.employeeId, input.employeeName)}`,
            withResolvedEmployeeParams(ctx, {
              employeeId: input.employeeId,
              employeeName: input.employeeName,
              serviceIds: input.serviceIds,
              userId: ctx.userId,
            }),
            { chainPrevious: input.chainPrevious ?? false },
          ),
        {
          name: 'propose_assign_employee_services',
          description: 'PROPOSE assign catalog services to a provider.',
          schema: employeeSchema.extend({
            serviceIds: z.array(z.string()).min(1),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),

      // ── Recovery / conflicts ──
      tool(
        async (input) =>
          propose(
            'propose_reassignment',
            'Propose rebooking assignments for freed slots',
            { businessId: ctx.businessId },
            { chainPrevious: input.chainPrevious ?? true },
          ),
        {
          name: 'propose_rebooking',
          description: 'PROPOSE waitlist rebooking after find_freed_slots + find_rebooking_candidates.',
          schema: z.object({ chainPrevious: z.boolean().optional() }),
        },
      ),
      tool(
        async (input) =>
          propose(
            'propose_resolutions',
            'Propose conflict resolutions',
            { preferMinimalDisruption: input.preferMinimalDisruption ?? true },
            { chainPrevious: input.chainPrevious ?? true },
          ),
        {
          name: 'propose_conflict_resolutions',
          description: 'PROPOSE resolutions after detect_conflicts + analyze_resolution_options.',
          schema: z.object({
            preferMinimalDisruption: z.boolean().optional(),
            chainPrevious: z.boolean().optional(),
          }),
        },
      ),

      // ── Compound meta-tool ──
      tool(
        async (input) =>
          proposeManySteps(
            ctx,
            input.steps.map((s, i) => ({
              action: s.action,
              description: s.description,
              params: { ...s.params, userId: ctx.userId },
              chainPrevious: s.chainPrevious ?? i > 0,
            })),
          ),
        {
          name: 'propose_compound_workflow',
          description: `PROPOSE multi-step workflow in one call. Use for "cancel then clear then hide" or any chained manager command. Max ${10} steps. Set chainPrevious=true to serialize steps.`,
          schema: z.object({
            steps: z.array(compoundStepSchema).min(1).max(10),
          }),
        },
      ),
    ];
  }
}
