import { Between, Not, In } from 'typeorm';
import type { Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import type { CommissionsService } from '../commissions/commissions.service.js';
import type { BusinessService } from '../business/business.service.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import {
  getBusinessDefaultCurrency,
  formatBusinessMoney,
} from '../../common/utils/business-currency.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { resolveDateRange } from './ai-orchestration.helpers.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatAppointmentCountSummary,
  formatProviderRevenueSummary,
  isoDateRangeToUtcBounds,
  summarizeProviderAppointmentCounts,
  summarizeProviderRevenue,
} from './ai-provider-earnings.util.js';

export interface ProviderEarningsLogicDeps {
  bookingRepo: Repository<Booking>;
  commissionsService: CommissionsService;
  businessService: BusinessService;
  providerMobile: ProviderMobileService;
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

async function resolveProviderDateRange(
  params: Record<string, unknown>,
  prompt?: string,
): Promise<{ start: string; end: string }> {
  const range =
    resolveDateRange(
      {
        date: params.date as string | null | undefined,
        dateFrom: params.dateFrom as string | null | undefined,
        dateTo: params.dateTo as string | null | undefined,
        _timeZone: params._timeZone as string | null | undefined,
      },
      prompt,
    ) ?? { start: getTodayDateKey(), end: getTodayDateKey() };
  return range;
}

async function loadScopedBookings(
  deps: ProviderEarningsLogicDeps,
  businessId: string,
  userId: string,
  range: { start: string; end: string },
): Promise<{ bookings: Booking[]; employeeId: string | null }> {
  const access = await deps.providerMobile.resolveMobileAccess(businessId, userId);
  const employeeId = deps.providerMobile.getScopedEmployeeId(access) ?? null;
  const { start, end } = isoDateRangeToUtcBounds(range);

  const where: Record<string, unknown> = {
    businessId,
    startTime: Between(start, end),
    status: Not(In([BookingStatus.CANCELLED])),
  };
  if (employeeId) {
    where.employeeId = employeeId;
  }

  const bookings = await deps.bookingRepo.find({
    where,
    relations: { service: true },
    order: { startTime: 'ASC' },
  });

  return { bookings, employeeId };
}

export async function handleSummarizeMyAppointmentsLogic(
  deps: ProviderEarningsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(businessId, userId);
  if (access.viewMode === 'team' && !access.employee) {
    return failure(
      'summarize_my_appointments',
      'Link a provider profile to your account to count your own appointments, or ask about a specific provider from the dashboard.',
      { clarify: true },
    );
  }

  const range = await resolveProviderDateRange(params, prompt);
  const { bookings, employeeId } = await loadScopedBookings(
    deps,
    businessId,
    userId,
    range,
  );
  const summary = summarizeProviderAppointmentCounts(bookings, range, prompt);

  return success(
    'summarize_my_appointments',
    formatAppointmentCountSummary(summary),
    {
      ...summary,
      employeeId,
      viewMode: access.viewMode,
    },
  );
}

export async function handleSummarizeMyRevenueLogic(
  deps: ProviderEarningsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const access = await deps.providerMobile.resolveMobileAccess(businessId, userId);
  if (!access.employee) {
    return failure(
      'summarize_my_revenue',
      'Link a provider profile to your account to see your net earnings.',
      { clarify: true },
    );
  }

  const range = await resolveProviderDateRange(params, prompt);
  const { bookings } = await loadScopedBookings(deps, businessId, userId, range);
  const [business, rules] = await Promise.all([
    deps.businessService.findOne(businessId),
    deps.commissionsService.list(businessId),
  ]);
  const settings = (business?.settings ?? {}) as Record<string, unknown>;
  const currency = getBusinessDefaultCurrency(settings);
  const summary = summarizeProviderRevenue(
    bookings.map((booking) => ({
      id: booking.id,
      employeeId: booking.employeeId,
      serviceId: booking.serviceId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      service: booking.service,
      metadata: booking.metadata as Record<string, unknown> | null,
    })),
    rules,
    range,
    currency,
    prompt,
  );

  return success(
    'summarize_my_revenue',
    formatProviderRevenueSummary(summary, (amount, code) =>
      formatBusinessMoney(amount, settings, code),
    ),
    {
      ...summary,
      employeeId: access.employee.id,
      viewMode: access.viewMode,
    },
  );
}

export async function dispatchProviderEarningsIntent(
  deps: ProviderEarningsLogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult | null> {
  switch (action) {
    case 'summarize_my_appointments':
      return handleSummarizeMyAppointmentsLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
      );
    case 'summarize_my_revenue':
      return handleSummarizeMyRevenueLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
      );
    default:
      return null;
  }
}
