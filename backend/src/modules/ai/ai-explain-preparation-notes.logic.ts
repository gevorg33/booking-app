import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import {
  buildServicePreparationSnapshot,
  buildServicePreparationSummary,
  type ServicePreparationAspect,
} from '../../common/utils/service-preparation.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  matchCustomerOwnedBooking,
  type CustomerOwnedBookingMatchInput,
} from './ai-cancel-my-booking.util.js';
import {
  buildRescheduleOwnedBookingMatchParams,
  enrichRescheduleMyBookingParamsFromPrompt,
} from './ai-reschedule-my-booking.util.js';
import {
  parseExplainPreparationNotesFromPrompt,
  type ParsedExplainPreparationNotes,
} from './ai-explain-preparation-notes.util.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

async function resolveBookingForPreparationNotes(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string,
  parsed: ParsedExplainPreparationNotes,
): Promise<{ booking: Booking | null; ambiguous: Booking[] }> {
  const customerId = resolveSessionCustomerId(params);
  const bookingId =
    parsed.bookingId ?? (params.bookingId as string | undefined) ?? undefined;

  if (bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: {
        id: bookingId,
        businessId,
        ...(customerId ? { customerId } : {}),
      },
      relations: { service: true },
    });
    return { booking: booking ?? null, ambiguous: [] };
  }

  if (!customerId) {
    return { booking: null, ambiguous: [] };
  }

  const enrichedParams = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    String(params._timeZone ?? 'UTC'),
  );
  const matchParams = buildRescheduleOwnedBookingMatchParams(enrichedParams);
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      customerId,
      status: BookingStatus.CONFIRMED,
    },
    relations: { service: true },
    order: { startTime: 'ASC' },
  });

  // e2e-bug.453 — the third parameter is `prompt`, and this passed a *service
  // name* into it. Both are `string`, so nothing complained.
  //
  // It was not merely mislabelled, it lost work: `matchCustomerOwnedBooking`
  // filters by service from `params.serviceName` (already on `matchParams`) and
  // never looks at this argument for that. What it uses it for is date
  // narrowing — `resolveDateRange` and `extractSingleIsoDayFromPrompt` — so
  // handing it a service name, or `''` when the prompt named no service, meant
  // "do I need to fast before tomorrow's visit?" could never narrow to
  // tomorrow's booking.
  const matched = matchCustomerOwnedBooking(
    bookings as CustomerOwnedBookingMatchInput[],
    matchParams,
    prompt,
    String(params._timeZone ?? 'UTC'),
    { allowFirstWhenUnspecified: true },
  );
  return {
    booking: matched.booking as Booking | null,
    ambiguous: matched.ambiguous as Booking[],
  };
}

async function resolveServiceForPreparationNotes(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  booking: Booking | null,
  serviceName?: string,
): Promise<Service | null> {
  if (booking?.service) return booking.service;
  if (!serviceName) return null;

  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  return resolveByName(services, serviceName) ?? null;
}

export function buildExplainPreparationNotesSummary(input: {
  service: Pick<Service, 'id' | 'name' | 'metadata'>;
  aspect: ServicePreparationAspect;
}): string {
  const snapshot = buildServicePreparationSnapshot(input.service);
  return buildServicePreparationSummary(snapshot, input.aspect);
}

export async function handleExplainPreparationNotesLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseExplainPreparationNotesFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_preparation_notes',
      'Ask about visit preparation (e.g. "Do I need to fast?" or "What should I bring to my appointment?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_preparation_notes', 'Business not found.');
  }

  const resolved = await resolveBookingForPreparationNotes(
    deps,
    businessId,
    params,
    prompt,
    parsed,
  );

  if (resolved.ambiguous.length > 1) {
    return failure(
      'explain_preparation_notes',
      'You have more than one upcoming appointment. Name the service or date so I can show the right preparation notes.',
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: resolved.ambiguous.map((row) => ({
          bookingId: row.id,
          serviceName: row.service?.name,
          startTime: row.startTime.toISOString(),
        })),
      },
    );
  }

  const service = await resolveServiceForPreparationNotes(
    deps,
    businessId,
    resolved.booking,
    parsed.serviceName,
  );

  if (!service) {
    return failure(
      'explain_preparation_notes',
      resolveSessionCustomerId(params)
        ? 'I could not find a booking or service to explain preparation for. Finish checkout or name the service.'
        : 'Finish booking or sign in so I can read preparation notes from your appointment.',
      {
        clarify: true,
        missing: ['bookingId'],
        navigate: resolveSessionCustomerId(params)
          ? { path: 'account', query: { tab: 'bookings' } }
          : undefined,
      },
    );
  }

  const snapshot = buildServicePreparationSnapshot(service);
  const summary = buildServicePreparationSummary(snapshot, parsed.aspect);

  return success('explain_preparation_notes', summary, {
    aspect: parsed.aspect,
    bookingId: resolved.booking?.id ?? null,
    serviceId: service.id,
    serviceName: service.name,
    requiresFasting: snapshot.requiresFasting,
    preparationNotes: snapshot.preparationNotes,
    meetingPoint: snapshot.meetingPoint,
    includedItems: snapshot.includedItems,
    navigate: {
      path: 'booking',
      query: {
        serviceId: service.id,
        ...(resolved.booking?.id ? { bookingId: resolved.booking.id } : {}),
      },
    },
  });
}
