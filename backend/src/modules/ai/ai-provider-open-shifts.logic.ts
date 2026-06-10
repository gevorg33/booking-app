import { Between, type Repository } from 'typeorm';
import type { BusinessService } from '../business/business.service.js';
import type { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatDateDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { resolveAvailabilityDayBounds } from '../provider-mobile/provider-ai-sprint19.util.js';
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
  const dateKey =
    normalizeScheduleDateKey(rawDate) ??
    (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate) ? toIsoDay(rawDate) : null);
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

  const waitlist = await deps.customerRepo
    .createQueryBuilder('c')
    .where('c.business_id = :businessId', { businessId })
    .andWhere(`'waitlist' = ANY(c.tags)`)
    .orderBy('c.name', 'ASC')
    .getMany();

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
