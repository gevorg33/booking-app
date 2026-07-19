import { Between, In, type Repository } from 'typeorm';
import type { BusinessService } from '../business/business.service.js';
import type { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import {
  WAITLIST_CUSTOMER_TAG,
  andWhereSimpleArrayTag,
} from '../customer/customer-tag-query.util.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { BookingService } from '../booking/booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { resolveAvailabilityDayBounds } from '../provider-mobile/provider-ai-sprint19.util.js';
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';
import {
  extractSingleIsoDayFromPrompt,
  fuzzyMatchServiceByName,
} from './ai-orchestration.helpers.js';
import {
  formatCustomerWaitlistPreferenceSummary,
  readCustomerWaitlistRequest,
  type CustomerWaitlistRequest,
} from '../../common/utils/customer-waitlist.util.js';
import {
  extractGapWindowFromPrompt,
  findOpenShiftsInWindow,
  formatWaitlistGapSuggestionSummary,
  isProviderOpenShiftsEnabled,
  normalizeScheduleDateKey,
  PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW,
  readProviderOpenShiftsSettings,
} from '../provider-mobile/provider-open-shifts.util.js';

export interface ProviderOpenShiftsLogicDeps {
  businessService: BusinessService;
  periodRepo: Repository<SchedulingPeriod>;
  customerRepo: Repository<Customer>;
  bookingRepo: Repository<Booking>;
  serviceRepo: Repository<Service>;
  employeeRepo: Repository<Employee>;
  bookingService: BookingService;
}

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

export async function handleSuggestWaitlistForGapLogic(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
  employeeId: string,
  prompt: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const business = await deps.businessService.findOne(businessId);
  const settings = (business?.settings ?? {}) as Record<string, unknown>;
  if (!isProviderOpenShiftsEnabled(readProviderOpenShiftsSettings(settings))) {
    return failure(
      'suggest_waitlist_for_gap',
      'Open shifts are disabled. Ask your manager to enable them in dashboard settings.',
    );
  }

  const rawDate = String(params.date ?? params.dateFrom ?? '').trim();
  // e2e-bug.67 — "Fill this gap" UI sends ISO dates in the prompt; LLM often
  // omits params.date, so fall back to deterministic prompt extraction.
  const dateKey =
    normalizeScheduleDateKey(rawDate) ??
    (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate) ? toIsoDay(rawDate) : null) ??
    extractSingleIsoDayFromPrompt(prompt);
  if (!dateKey) {
    return failure(
      'suggest_waitlist_for_gap',
      'Specify the gap date (e.g. "Fill this gap on 09/06/2026 from 14:00 to 15:30").',
      { clarify: true },
    );
  }

  const extracted = extractGapWindowFromPrompt(prompt);
  const timeFrom = params.timeFrom
    ? normalizeTime24(String(params.timeFrom))
    : extracted.timeFrom;
  const timeTo = params.timeTo
    ? normalizeTime24(String(params.timeTo))
    : extracted.timeTo;

  if (!timeFrom || !timeTo) {
    return failure(
      'suggest_waitlist_for_gap',
      'Specify the gap window with start and end times (e.g. 14:00 to 15:30).',
      { clarify: true },
    );
  }

  const { day, dayEnd } = resolveAvailabilityDayBounds(dateKey);
  const periods = await deps.periodRepo.find({
    where: {
      businessId,
      employeeId,
      startTime: Between(day, dayEnd),
    },
    order: { startTime: 'ASC' },
  });

  const gaps = findOpenShiftsInWindow(day, periods);

  const matchingGap = gaps.find(
    (gap) => gap.startTime === timeFrom && gap.endTime === timeTo,
  );
  if (!matchingGap) {
    const available = gaps
      .map((gap) => `${gap.startTime}–${gap.endTime}`)
      .join(', ');
    return failure(
      'suggest_waitlist_for_gap',
      available
        ? `No ${timeFrom}–${timeTo} gap on ${formatDateDisplay(toIsoDay(dateKey))}. Open gaps: ${available}.`
        : `No open gaps over 30 minutes on ${formatDateDisplay(toIsoDay(dateKey))} between ${PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW.timeFrom} and ${PROVIDER_OPEN_SHIFTS_DEFAULT_WINDOW.timeTo}.`,
      { gaps },
    );
  }

  const waitlistQb = deps.customerRepo
    .createQueryBuilder('c')
    .where('c.business_id = :businessId', { businessId })
    .orderBy('c.name', 'ASC');
  andWhereSimpleArrayTag(waitlistQb, 'c', WAITLIST_CUSTOMER_TAG, 'waitlistTag');
  const waitlist = await waitlistQb.getMany();

  const waitlistNames = waitlist.map((customer) => customer.name);
  const displayDay = formatDateDisplay(toIsoDay(dateKey));

  return success(
    'suggest_waitlist_for_gap',
    formatWaitlistGapSuggestionSummary({
      dateLabel: displayDay,
      gap: matchingGap,
      waitlistNames,
    }),
    {
      date: dateKey,
      gap: matchingGap,
      waitlistCustomers: waitlist.slice(0, 5).map((customer) => ({
        id: customer.id,
        name: customer.name,
      })),
      waitlistCount: waitlist.length,
    },
  );
}

/** ai-cmd-provider-5.5.3 — draft (copy-only) SMS text for the top waitlist candidate; no send. */
export async function handleDraftWaitlistOfferMessageLogic(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
  employeeId: string,
  prompt: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const suggestion = await handleSuggestWaitlistForGapLogic(
    deps,
    businessId,
    employeeId,
    prompt,
    params,
  );
  if (!suggestion.success) {
    return { ...suggestion, action: 'draft_waitlist_offer_message' };
  }

  const details = suggestion.details as {
    date: string;
    gap: { startTime: string; endTime: string };
    waitlistCustomers: { id: string; name: string }[];
  };
  const topCandidate = details.waitlistCustomers[0];
  if (!topCandidate) {
    return failure(
      'draft_waitlist_offer_message',
      'No waitlist customers to message for this gap.',
      details,
    );
  }

  const displayDay = formatDateDisplay(toIsoDay(details.date));
  const messageBody = `Hi ${topCandidate.name}, a ${details.gap.startTime}–${details.gap.endTime} slot just opened up on ${displayDay}. Want it? Reply YES to grab it!`;

  return success(
    'draft_waitlist_offer_message',
    `Draft message ready for ${topCandidate.name}.`,
    { ...details, customerName: topCandidate.name, messageBody },
  );
}

function extractWaitlistServiceNameFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  if (typeof params.serviceName === 'string' && params.serviceName.trim()) {
    return params.serviceName.trim();
  }
  const match = prompt.match(
    /\bwaiting\s+for\s+([A-Za-z][\w\s'-]*?)(?:\?|$)/i,
  );
  return match?.[1]?.trim() || null;
}

type ActiveWaitlistEntry = { customer: Customer; request: CustomerWaitlistRequest };

async function findActiveWaitlistEntries(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
): Promise<ActiveWaitlistEntry[]> {
  const waitlistQb = deps.customerRepo
    .createQueryBuilder('c')
    .where('c.business_id = :businessId', { businessId })
    .orderBy('c.name', 'ASC');
  andWhereSimpleArrayTag(waitlistQb, 'c', WAITLIST_CUSTOMER_TAG, 'waitlistTag');
  const waitlist = await waitlistQb.getMany();

  return waitlist
    .map((customer) => ({
      customer,
      request: readCustomerWaitlistRequest(customer.metadata),
    }))
    .filter(
      (row): row is ActiveWaitlistEntry =>
        row.request != null && row.request.status === 'active',
    );
}

/** ai-cmd-provider-5.9.2 — waitlist entries relevant to this provider's own services. */
export async function handleListWaitlistForMyServicesLogic(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
  employeeId: string,
  prompt: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const employee = await deps.employeeRepo.findOne({
    where: { id: employeeId, businessId },
  });
  const myServiceIds = new Set(employee?.serviceIds ?? []);

  const entries = await findActiveWaitlistEntries(deps, businessId);
  const serviceNameFilter = extractWaitlistServiceNameFromPrompt(
    prompt,
    params,
  );

  const scoped = entries
    .filter(({ request }) => {
      if (request.employeeId && request.employeeId !== employeeId) {
        return false;
      }
      if (
        request.serviceId &&
        myServiceIds.size > 0 &&
        !myServiceIds.has(request.serviceId)
      ) {
        return false;
      }
      return true;
    })
    .filter(({ request }) => {
      if (!serviceNameFilter) return true;
      return (request.serviceName ?? '')
        .toLowerCase()
        .includes(serviceNameFilter.toLowerCase());
    })
    .sort(
      (a, b) =>
        new Date(a.request.joinedAt).getTime() -
        new Date(b.request.joinedAt).getTime(),
    );

  if (scoped.length === 0) {
    return success(
      'list_waitlist_for_my_services',
      serviceNameFilter
        ? `No one is on the waitlist for ${serviceNameFilter} right now.`
        : 'No one is on your waitlist right now.',
      { count: 0 },
    );
  }

  const lines = scoped.map(
    ({ customer, request }) =>
      `• ${customer.name} — ${formatCustomerWaitlistPreferenceSummary(request)}`,
  );

  return success(
    'list_waitlist_for_my_services',
    `${scoped.length} on your waitlist:\n${lines.join('\n')}`,
    {
      count: scoped.length,
      entries: scoped.map(({ customer, request }) => ({
        customerId: customer.id,
        customerName: customer.name,
        request,
      })),
    },
  );
}

/** ai-cmd-provider-5.9.4 — who to call after a cancellation: matching waitlist + repeat regulars for the same service/provider. */
export async function handleListRebookingCandidatesLogic(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
  employeeId: string,
  params: Record<string, unknown>,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    (typeof context?.bookingId === 'string' && context.bookingId.trim()) ||
    null;

  if (!bookingId) {
    return failure(
      'list_rebooking_candidates',
      'Open the cancelled appointment to see rebooking candidates.',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const booking = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId },
    relations: { service: true },
  });
  if (!booking) {
    return failure(
      'list_rebooking_candidates',
      'Could not find that appointment.',
      { clarify: true },
    );
  }

  const entries = await findActiveWaitlistEntries(deps, businessId);
  const waitlistCandidates = entries
    .filter(({ request }) => {
      if (request.employeeId && request.employeeId !== booking.employeeId) {
        return false;
      }
      if (request.serviceId && request.serviceId !== booking.serviceId) {
        return false;
      }
      return true;
    })
    .slice(0, 5);

  const regularsRaw = await deps.bookingRepo
    .createQueryBuilder('b')
    .select('b.customer_id', 'customerId')
    .addSelect('COUNT(*)', 'visitCount')
    .where('b.business_id = :businessId', { businessId })
    .andWhere('b.employee_id = :employeeId', { employeeId: booking.employeeId })
    .andWhere('b.service_id = :serviceId', { serviceId: booking.serviceId })
    .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
    .andWhere('b.customer_id IS NOT NULL')
    .andWhere(
      booking.customerId ? 'b.customer_id != :excludeId' : '1=1',
      booking.customerId ? { excludeId: booking.customerId } : {},
    )
    .groupBy('b.customer_id')
    .having('COUNT(*) >= 2')
    .orderBy('COUNT(*)', 'DESC')
    .limit(5)
    .getRawMany<{ customerId: string; visitCount: string }>();

  const regularCustomers = regularsRaw.length
    ? await deps.customerRepo.find({
        where: { id: In(regularsRaw.map((row) => row.customerId)) },
      })
    : [];
  const regularsById = new Map(
    regularCustomers.map((customer) => [customer.id, customer]),
  );
  const regulars = regularsRaw
    .map((row) => ({
      customer: regularsById.get(row.customerId),
      visitCount: Number(row.visitCount),
    }))
    .filter(
      (row): row is { customer: Customer; visitCount: number } =>
        row.customer != null,
    );

  if (waitlistCandidates.length === 0 && regulars.length === 0) {
    return success(
      'list_rebooking_candidates',
      `No waitlist or regulars found for ${booking.service?.name ?? 'this service'}.`,
      { bookingId: booking.id, waitlistCount: 0, regularsCount: 0 },
    );
  }

  const parts: string[] = [];
  if (waitlistCandidates.length) {
    parts.push(
      `Waitlist: ${waitlistCandidates
        .map(({ customer }) => customer.name)
        .join(', ')}`,
    );
  }
  if (regulars.length) {
    parts.push(
      `Regulars: ${regulars
        .map((row) => `${row.customer.name} (${row.visitCount} visits)`)
        .join(', ')}`,
    );
  }

  return success('list_rebooking_candidates', parts.join('\n'), {
    bookingId: booking.id,
    waitlistCount: waitlistCandidates.length,
    regularsCount: regulars.length,
    waitlist: waitlistCandidates.map(({ customer, request }) => ({
      customerId: customer.id,
      customerName: customer.name,
      request,
    })),
    regulars: regulars.map((row) => ({
      customerId: row.customer.id,
      customerName: row.customer.name,
      visitCount: row.visitCount,
    })),
  });
}

function extractWalkInServiceNameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\bbook\s+(?:a\s+|an\s+)?(?:walk-?in\s+)?(?:\d{1,3}\s*min(?:ute)?s?\s+)?([A-Za-z][\w\s'-]*?)\s+(?:now|walk-?in|in\s+the|at\s+\d|for\s+\d|today)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length >= 3) return candidate;
  }
  return null;
}

function extractWalkInCustomerNameFromPrompt(prompt: string): string | null {
  const match = prompt.match(/\bfor\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\b/);
  return match?.[1]?.trim() ?? null;
}

function resolveWalkInStartTime(
  prompt: string,
  params: Record<string, unknown>,
  now: Date,
): Date {
  if (/\bnow\b/i.test(prompt)) return now;
  const timeSlot =
    (typeof params.timeFrom === 'string' && params.timeFrom.trim()) ||
    extractTimeSlotFromPrompt(prompt);
  if (!timeSlot) return now;
  const todayKey = now.toISOString().slice(0, 10);
  return new Date(`${todayKey}T${timeSlot}:00.000Z`);
}

/** ai-cmd-provider-5.9.5 — book a walk-in (no customer record) into an open gap on own calendar. */
export async function handleBookWalkInGapLogic(
  deps: ProviderOpenShiftsLogicDeps,
  businessId: string,
  employeeId: string,
  userId: string,
  prompt: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    extractWalkInServiceNameFromPrompt(prompt);
  if (!serviceName) {
    return failure(
      'book_walk_in_gap',
      'Which service should the walk-in book? (e.g. "Quick book Trim now")',
      { clarify: true, missing: ['serviceName'] },
    );
  }

  const services = await deps.serviceRepo.find({ where: { businessId } });
  const service = fuzzyMatchServiceByName(services, serviceName);
  if (!service) {
    return failure(
      'book_walk_in_gap',
      `Could not find a service matching "${serviceName}".`,
      { clarify: true },
    );
  }

  const now = new Date();
  const startTime = resolveWalkInStartTime(prompt, params, now);
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()) ||
    extractWalkInCustomerNameFromPrompt(prompt) ||
    null;

  try {
    const booking = await deps.bookingService.create(
      businessId,
      {
        employeeId,
        serviceId: service.id,
        startTime: startTime.toISOString(),
        notes: customerName ? `Walk-in: ${customerName}` : 'Walk-in',
        metadata: customerName ? { walkInCustomerName: customerName } : undefined,
      } as Parameters<BookingService['create']>[1],
      userId,
    );

    return success(
      'book_walk_in_gap',
      `Booked ${service.name} for ${customerName ?? 'walk-in'} at ${formatTimeDisplay(booking.startTime)}.`,
      {
        bookingId: booking.id,
        serviceName: service.name,
        startTime: booking.startTime,
        customerName,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not book the walk-in.';
    return failure('book_walk_in_gap', message, {});
  }
}
