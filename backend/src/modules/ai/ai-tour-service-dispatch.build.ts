import type { CommandResult } from './command-completion.types.js';
import type { AiTourServiceService } from './ai-tour-service.service.js';
import {
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
} from './ai-tour-service.util.js';
import { parseExplainTourBookingRecordFromPrompt } from './ai-tour-booking-record.util.js';
import { parseExplainTourCalendarSpanFromPrompt } from './ai-tour-calendar-span.util.js';
import { parseListTourCalendarWeekFromPrompt } from './ai-tour-calendar-week.util.js';
import { parseListUpcomingTourDeparturesFromPrompt } from './ai-upcoming-tour-departures.util.js';

export type TourServiceDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  userId?: string;
};

export type TourServiceDispatchHandler = (
  service: AiTourServiceService,
  ctx: TourServiceDispatchContext,
) => Promise<CommandResult>;

export function buildTourServiceDispatchMap(): ReadonlyMap<
  string,
  TourServiceDispatchHandler
> {
  const map = new Map<string, TourServiceDispatchHandler>();

  map.set('configure_tour_service', async (service, ctx) => {
    const parsed = parseConfigureTourServiceFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          ...(parsed.enableTour
            ? { enableTour: true, serviceType: 'tour' }
            : {}),
          ...(parsed.maxGroupSize !== undefined
            ? { maxGroupSize: parsed.maxGroupSize }
            : {}),
          ...(parsed.difficulty ? { difficulty: parsed.difficulty } : {}),
          ...(parsed.coverImage ? { coverImage: parsed.coverImage } : {}),
          ...(parsed.meetingPoint
            ? { meetingPoint: parsed.meetingPoint }
            : {}),
          ...(parsed.includedItems
            ? { includedItems: parsed.includedItems }
            : {}),
          ...(parsed.durationDays !== undefined
            ? { durationDays: parsed.durationDays }
            : {}),
        }
      : ctx.params;
    return service.handleConfigureTourService(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_tour_services', async (service, ctx) => {
    const parsed = parseExplainTourServicesFromPrompt(ctx.prompt, ctx.params);
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          daysAhead: parsed.daysAhead,
        }
      : ctx.params;
    return service.handleExplainTourServices(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_tour_booking_record', async (service, ctx) => {
    const parsed = parseExplainTourBookingRecordFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          bookingId: parsed.bookingId,
          customerName: parsed.customerName,
          serviceName: parsed.serviceName,
          aspect: parsed.aspect,
        }
      : ctx.params;
    return service.handleExplainTourBookingRecord(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_tour_calendar_span', async (service, ctx) => {
    const parsed = parseExplainTourCalendarSpanFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          weekStartDate: parsed.weekStartDate,
          aspect: parsed.aspect,
        }
      : ctx.params;
    return service.handleExplainTourCalendarSpan(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('list_tour_calendar_week', async (service, ctx) => {
    const parsed = parseListTourCalendarWeekFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          employeeId: parsed.employeeId,
          employeeName: parsed.employeeName,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          weekStartDate: parsed.weekStartDate,
        }
      : ctx.params;
    return service.handleListTourCalendarWeek(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('list_upcoming_tour_departures', async (service, ctx) => {
    const parsed = parseListUpcomingTourDeparturesFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          serviceId: parsed.serviceId,
          serviceName: parsed.serviceName,
          daysAhead: parsed.daysAhead,
        }
      : ctx.params;
    return service.handleListUpcomingTourDepartures(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('apply_tour_playbook', async (service, ctx) =>
    service.handleApplyTourPlaybook(
      ctx.businessId,
      ctx.userId,
      ctx.params,
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiTourServiceService (ai-cmd-ext-0.5). */
export const TOUR_SERVICE_DISPATCH_MAP = buildTourServiceDispatchMap();
