import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  applyAvailabilityDateFromPrompt,
  hasExplicitWeekdayInAvailabilityPrompt,
  resolvePublicAvailabilityWindows,
} from './ai-orchestration.helpers.js';
import { resolveTimezone } from '../../common/utils/timezone.util.js';
import {
  buildNoNearestSlotMessage,
  buildSoonestAppointmentFoundMessage,
} from './ai-booking-slot-messages.util.js';
import {
  applyChosenAvailabilityWindowToParams,
  buildNearestAvailabilityWindowQueries,
  buildNearestBookableSlotQuery,
} from './ai-nearest-slot-resolver.util.js';
import { applyPromptMentionedServiceOverrideToParams } from './ai-booking-param-hints.util.js';
import { resolveDiscoverConstrainedService } from './ai-budget-list-services.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';
import { enrichFindSoonestParamsFromPrompt } from './ai-find-soonest-appointment.util.js';

async function resolveBusinessSlug(
  deps: PaymentsLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveServiceForSoonest(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Service | undefined> {
  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });

  if (params.serviceId) {
    return services.find((entry) => entry.id === params.serviceId);
  }

  const name = (params.serviceName as string | undefined)?.trim();
  if (!name) return undefined;

  const needle = name.toLowerCase();
  return (
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle))
  );
}

export async function handleFindSoonestAppointmentLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) {
    return {
      success: false,
      action: 'find_soonest_appointment',
      summary: 'Business not found.',
      details: {},
    };
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const tz = resolveTimezone(business?.timezone);
  const textPrompt = prompt || String(params._prompt ?? '');
  const enrichedParams = enrichFindSoonestParamsFromPrompt(
    params,
    textPrompt,
    tz,
  );

  const catalogServices = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  const catalog = catalogServices.map((entry) => ({
    id: entry.id,
    name: entry.name,
  }));
  if (textPrompt.trim()) {
    Object.assign(
      enrichedParams,
      applyPromptMentionedServiceOverrideToParams(
        textPrompt,
        enrichedParams,
        catalog,
      ),
    );
  }

  let service = await resolveServiceForSoonest(
    deps,
    businessId,
    enrichedParams,
  );
  if (!service && enrichedParams.serviceRank) {
    const pricedCatalog = catalogServices.map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: Number(entry.price),
      durationMinutes: entry.durationMinutes,
    }));
    const discoverResolved = resolveDiscoverConstrainedService(pricedCatalog, {
      serviceId: enrichedParams.serviceId,
      serviceName: enrichedParams.serviceName,
      serviceCategory: enrichedParams.serviceCategory,
      maxPrice: enrichedParams.maxPrice,
      serviceRank: enrichedParams.serviceRank,
    });
    if (discoverResolved.service) {
      service = catalogServices.find(
        (entry) => entry.id === discoverResolved.service!.id,
      );
    }
  }

  if (!service) {
    return {
      success: false,
      action: 'find_soonest_appointment',
      summary: 'Specify which service to find the soonest opening for.',
      details: {
        clarify: true,
        missing: ['serviceName'],
      },
    };
  }

  const queryParams = { ...enrichedParams };
  if (hasExplicitWeekdayInAvailabilityPrompt(queryParams, textPrompt)) {
    applyAvailabilityDateFromPrompt(queryParams, textPrompt, tz);
  }
  resolvePublicAvailabilityWindows(queryParams, textPrompt, tz);

  const slotQuery = buildNearestBookableSlotQuery(
    queryParams,
    textPrompt,
    (queryParams.employeeId as string | null | undefined) ?? null,
  );
  const { notBeforeTime, startDateKey, timeOfDay } = slotQuery;
  const windowQueries = buildNearestAvailabilityWindowQueries(
    queryParams,
    textPrompt,
    tz,
  );

  const nearestResult =
    await deps.publicBookingService.findNearestBookableSlotAcrossWindows(slug, {
      serviceId: service.id,
      employeeId: slotQuery.employeeId,
      windows: windowQueries,
    });

  if (!nearestResult) {
    return {
      success: false,
      action: 'find_soonest_appointment',
      summary: buildNoNearestSlotMessage({
        serviceName: service.name,
        dateKey: startDateKey ?? undefined,
        timeOfDay,
        notBeforeTime,
      }),
      details: {
        serviceId: service.id,
        serviceName: service.name,
        bookingFirstAvailable: true,
        reason: 'no_slots',
      },
    };
  }

  const withWindow = applyChosenAvailabilityWindowToParams(
    queryParams,
    nearestResult,
  );
  const slot = nearestResult.slot;

  return {
    success: true,
    action: 'find_soonest_appointment',
    summary: buildSoonestAppointmentFoundMessage({
      startTime: slot.startTime,
      employeeName: slot.employeeName,
      serviceName: service.name,
      locale: params.locale,
    }),
    details: {
      slot,
      serviceId: service.id,
      serviceName: service.name,
      employeeId: slot.employeeId,
      startTime: slot.startTime,
      date: slot.dateKey,
      timeOfDay: nearestResult.timeOfDay,
      bookingFirstAvailable: true,
      chosenAvailabilityWindow: withWindow.chosenAvailabilityWindow,
      chosenAvailabilityWindowIndex: withWindow.chosenAvailabilityWindowIndex,
      navigate: {
        path: 'checkout',
        query: {
          serviceId: service.id,
          employeeId: slot.employeeId,
          startTime: slot.startTime,
        },
      },
    },
  };
}
