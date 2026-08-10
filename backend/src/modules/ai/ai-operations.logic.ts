import { Between, In, Not, Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CommandResult } from './ai-command.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import {
  resolveEmployees,
  resolveServices,
  resolveDateRange,
} from './ai-orchestration.helpers.js';
import {
  applyPriceAdjustment,
  computeRevenueForecast,
  enrichPaymentSweepParams,
  extractMenuTextFromParams,
  filterBookingsForPaymentSweep,
  isBookingOutsideBusinessHours,
  mapOperationsOrchestrationResult,
  mergeServiceIds,
  parseBusinessHoursWindow,
  parsePriceAdjustment,
  parseSickEmployeeName,
  parseMenuTextToServices,
  removeServiceIds,
  resolveEmployeesBySeniority,
  resolveServicesByCategoryHint,
  shouldAutoExecuteOperations,
} from './ai-operations.util.js';
import {
  enrichUpdateServicePricesParamsFromPrompt,
  filterServicesForUpdateServicePricesOnlinePayment,
} from './ai-update-service-prices-online-payment-filter.util.js';
import {
  buildImportServicesReviewPlanMeta,
  buildImportServicesReviewPlanSteps,
  buildNoShowRecoveryPlanMeta,
  buildNoShowRecoveryPlanSteps,
  buildSickDayReplanPlanMeta,
  buildSickDayReplanPlanSteps,
  buildStaffServiceMatrixPlanMeta,
  buildStaffServiceMatrixPlanSteps,
  buildUpdateServicePricesPlanMeta,
  buildUpdateServicePricesPlanSteps,
  type ServicePriceUpdate,
} from './ai-operations-plan.util.js';

export interface OperationsLogicDeps {
  bookingRepo: Pick<Repository<Booking>, 'find'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  orchestration: Pick<
    CommandOrchestrationService,
    'executePlan' | 'approveTask'
  >;
  planBuilder: OperationalPlanBuilderService;
}

export function buildNoShowRecoveryFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'no_show_recovery',
    summary:
      'No eligible past appointments found to mark as no-show and recover.',
    details: { params },
  };
}

export function buildSickDayReplanFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'sick_day_replan',
    summary:
      'Specify which provider is sick and which day to replan (e.g. "Maria is sick — cancel her day and redistribute urgent bookings").',
    details: { params },
  };
}

export function buildImportServicesFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'import_services_from_menu',
    summary:
      'Paste menu text or attach OCR output (e.g. "Facial 60min $50, Haircut 30min $25") for human review before import.',
    details: { params },
  };
}

export function buildUpdateServicePricesFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'update_service_prices',
    summary:
      'Specify a percent or dollar amount change and optional category (e.g. "Raise all massage prices 10%" or "Increase Facial by 5 dollars").',
    details: { params },
  };
}

export function buildStaffServiceMatrixFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'staff_service_matrix',
    summary:
      'Specify service category and seniority rule (e.g. "Assign all color services to senior stylists only").',
    details: { params },
  };
}

export function buildComplianceCheckFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'check_schedule_compliance',
    summary: 'Specify a date range to check (e.g. "this month").',
    details: { params },
  };
}

export function buildRevenueForecastFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'revenue_forecast',
    summary: 'Specify a forecast period (e.g. "next week").',
    details: { params },
  };
}

export async function executeOperationsPlan(
  deps: Pick<OperationsLogicDeps, 'orchestration'>,
  plan: AgentPlan,
  businessId: string,
  userId: string | undefined,
): Promise<CommandResult> {
  const result = await deps.orchestration.executePlan({
    plan,
    businessId,
    userId,
    autoExecute: shouldAutoExecuteOperations(plan.intent, plan.steps.length),
  });
  // e2e-bug.164 — AI command confirmation already authorized the mutation.
  // Policy "requires approval" must not return success:true with zero writes.
  if (
    result.requiresApproval &&
    result.taskId &&
    plan.intent === 'update_service_prices' &&
    userId
  ) {
    const approved = await deps.orchestration.approveTask(
      result.taskId,
      userId,
    );
    return mapOperationsOrchestrationResult(approved);
  }
  return mapOperationsOrchestrationResult(result);
}

export async function prepareNoShowRecoveryPlanLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  bookingIds: string[],
  userId?: string,
): Promise<AgentPlan | null> {
  if (!bookingIds.length) return null;
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC');
  const steps = buildNoShowRecoveryPlanSteps({
    businessId,
    bookingIds,
    userId,
    date:
      params.date ?? (range?.start === range?.end ? range?.start : undefined),
    dateRange: range && range.start !== range.end ? range : undefined,
  });
  const meta = buildNoShowRecoveryPlanMeta(bookingIds.length);
  return deps.planBuilder.wrapOperationsPlan(
    businessId,
    'no_show_recovery',
    steps,
    meta,
  );
}

export async function prepareSickDayReplanPlanLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  timeZone: string,
  userId?: string,
): Promise<AgentPlan | null> {
  params._timeZone = timeZone;
  const employeeName = parseSickEmployeeName(prompt, params);
  if (!employeeName) return null;

  const targets = resolveEmployees(employees, { ...params, employeeName });
  if (targets.length !== 1) return null;

  const range = resolveDateRange(params, prompt, timeZone);
  if (!range) return null;
  const date = params.date ?? range.start;

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      employeeId: targets[0].id,
      startTime: Between(dayStart, dayEnd),
      status: Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      ) as any,
    },
    order: { startTime: 'ASC' },
  });

  const urgentOnly = /\burgent\b/i.test(prompt);
  const bookingIds = urgentOnly
    ? bookings
        .filter(
          (b) =>
            b.notes?.toLowerCase().includes('urgent') ||
            b.metadata?.urgent === true,
        )
        .map((b) => b.id)
    : bookings.map((b) => b.id);

  const steps = buildSickDayReplanPlanSteps({
    businessId,
    employeeId: targets[0].id,
    employeeName: targets[0].name,
    date,
    bookingIds,
    userId,
  });
  const meta = buildSickDayReplanPlanMeta({
    employeeName: targets[0].name,
    date,
    bookingCount: bookingIds.length,
  });
  return deps.planBuilder.wrapOperationsPlan(
    businessId,
    'sick_day_replan',
    steps,
    meta,
  );
}

export function prepareImportServicesFromMenuPlanLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
): AgentPlan | null {
  const menuText = extractMenuTextFromParams(prompt, params);
  const parsed =
    menuText != null
      ? parseMenuTextToServices(menuText)
      : Array.isArray(params.services)
        ? params.services.map((s: Record<string, unknown>) => ({
            serviceName: String(s.serviceName ?? s.name ?? ''),
            durationMinutes: Number(s.durationMinutes ?? 30),
            price: Number(s.price ?? 0),
          }))
        : [];

  const services = parsed
    .filter((s) => s.serviceName && s.durationMinutes > 0 && s.price >= 0)
    .map((s) => ({
      name: s.serviceName,
      durationMinutes: s.durationMinutes,
      price: s.price,
      currency: 'USD',
    }));

  if (!services.length) return null;

  const steps = buildImportServicesReviewPlanSteps({
    businessId,
    services,
    userId,
  });
  const meta = buildImportServicesReviewPlanMeta(services.length);
  return deps.planBuilder.wrapOperationsPlan(
    businessId,
    'import_services_from_menu',
    steps,
    meta,
  );
}

export function prepareUpdateServicePricesPlanLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  services: Service[],
  userId?: string,
): AgentPlan | null {
  const enrichedParams = enrichUpdateServicePricesParamsFromPrompt(
    params,
    prompt,
  );
  const adjustment = parsePriceAdjustment(prompt, enrichedParams);
  if (!adjustment) return null;

  let matched = services;
  if (adjustment.serviceNameHint) {
    matched = resolveServices(services, {
      serviceName: adjustment.serviceNameHint,
    });
  } else if (adjustment.categoryHint) {
    matched = resolveServicesByCategoryHint(services, adjustment.categoryHint);
  }

  if (enrichedParams.onlyWithOnlinePayment === true) {
    matched = filterServicesForUpdateServicePricesOnlinePayment(matched);
  }

  if (!matched.length) return null;

  const updates: ServicePriceUpdate[] = matched.map((service) => {
    const currentPrice = Number(service.price);
    return {
      serviceId: service.id,
      serviceName: service.name,
      currentPrice,
      newPrice: applyPriceAdjustment(currentPrice, adjustment),
    };
  });

  const steps = buildUpdateServicePricesPlanSteps({
    businessId,
    updates,
    userId,
    effectiveFrom: adjustment.effectiveFrom,
  });
  const meta = buildUpdateServicePricesPlanMeta({
    updates,
    percentChange: adjustment.percentChange,
    amountChange: adjustment.amountChange,
    effectiveFrom: adjustment.effectiveFrom,
  });
  return deps.planBuilder.wrapOperationsPlan(
    businessId,
    'update_service_prices',
    steps,
    meta,
  );
}

export function prepareStaffServiceMatrixPlanLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  services: Service[],
  userId?: string,
): AgentPlan | null {
  const categoryHint =
    (typeof params.categoryName === 'string' && params.categoryName) ||
    (typeof params.serviceName === 'string' && params.serviceName) ||
    prompt.match(/\ball\s+([a-z]+)\s+services?/i)?.[1] ||
    'color';

  const matchedServices = resolveServicesByCategoryHint(services, categoryHint);
  if (!matchedServices.length) return null;

  const seniors = resolveEmployeesBySeniority(employees, 'senior');
  const juniors = resolveEmployeesBySeniority(employees, 'junior');
  if (!seniors.length) return null;

  const serviceIds = matchedServices.map((s) => s.id);
  const seniorAssignments = seniors.map((e) => ({
    employeeId: e.id,
    employeeName: e.name,
    serviceIds: mergeServiceIds(e.serviceIds, serviceIds),
  }));
  const juniorAssignments = juniors.map((e) => ({
    employeeId: e.id,
    employeeName: e.name,
    serviceIds: removeServiceIds(e.serviceIds, serviceIds),
  }));

  const steps = buildStaffServiceMatrixPlanSteps({
    businessId,
    seniorAssignments,
    juniorAssignments,
    serviceNames: matchedServices.map((s) => s.name),
    userId,
  });
  const meta = buildStaffServiceMatrixPlanMeta({
    serviceNames: matchedServices.map((s) => s.name),
    seniorCount: seniors.length,
    juniorCount: juniors.length,
  });
  return deps.planBuilder.wrapOperationsPlan(
    businessId,
    'staff_service_matrix',
    steps,
    meta,
  );
}

export async function handleCheckScheduleComplianceLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC');
  if (!range) return buildComplianceCheckFailure(params);

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const hoursWindow = parseBusinessHoursWindow(
    (business?.settings ?? {}) as Record<string, unknown>,
  );

  const start = new Date(`${range.start}T00:00:00.000Z`);
  const end = new Date(`${range.end}T23:59:59.999Z`);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      startTime: Between(start, end),
      status: Not(In([BookingStatus.CANCELLED])) as any,
    },
    relations: { employee: true, service: true },
    order: { startTime: 'ASC' },
  });

  const violations = bookings.filter((b) =>
    isBookingOutsideBusinessHours(b.startTime, b.endTime, hoursWindow),
  );

  if (!violations.length) {
    return {
      success: true,
      action: 'check_schedule_compliance',
      summary: `All ${bookings.length} appointment(s) between ${range.start} and ${range.end} are within business hours.`,
      details: {
        dateRange: range,
        businessHours: hoursWindow,
        totalBookings: bookings.length,
        violations: [],
      },
    };
  }

  const lines = violations
    .slice(0, 10)
    .map(
      (b) =>
        `• ${b.employee?.name ?? 'Provider'} — ${b.service?.name ?? 'Service'} (${b.startTime.toISOString()})`,
    );
  const more =
    violations.length > 10 ? `\n…and ${violations.length - 10} more` : '';

  return {
    success: true,
    action: 'check_schedule_compliance',
    summary: `${violations.length} appointment(s) outside business hours (${range.start}–${range.end}):\n${lines.join('\n')}${more}`,
    details: {
      dateRange: range,
      businessHours: hoursWindow,
      totalBookings: bookings.length,
      violationCount: violations.length,
      violations: violations.map((b) => ({
        bookingId: b.id,
        employee: b.employee?.name,
        service: b.service?.name,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
      })),
    },
  };
}

export async function handleRevenueForecastLogic(
  deps: OperationsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC');
  if (!range) return buildRevenueForecastFailure(params);

  const start = new Date(`${range.start}T00:00:00.000Z`);
  const end = new Date(`${range.end}T23:59:59.999Z`);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      startTime: Between(start, end),
      status: In([
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
      ]) as any,
    },
    relations: { service: true },
    order: { startTime: 'ASC' },
  });

  const historicalStart = new Date(start);
  historicalStart.setUTCDate(historicalStart.getUTCDate() - 30);
  const historical = await deps.bookingRepo.find({
    where: {
      businessId,
      startTime: Between(historicalStart, start),
      status: In([BookingStatus.COMPLETED, BookingStatus.NO_SHOW]) as any,
    },
  });
  const completed = historical.filter(
    (b) => b.status === BookingStatus.COMPLETED,
  ).length;
  const noShows = historical.filter(
    (b) => b.status === BookingStatus.NO_SHOW,
  ).length;
  const denom = completed + noShows;
  const noShowRatePercent = denom > 0 ? Math.round((noShows / denom) * 100) : 0;

  const forecast = computeRevenueForecast(
    bookings.map((b) => ({ price: Number(b.service?.price ?? 0) })),
    noShowRatePercent,
  );

  return {
    success: true,
    action: 'revenue_forecast',
    summary: `Revenue forecast ${range.start}–${range.end}: gross $${forecast.grossRevenue}, expected $${forecast.expectedRevenue} (${forecast.bookingCount} bookings, ${forecast.noShowRatePercent}% historical no-show rate).`,
    details: {
      dateRange: range,
      ...forecast,
    },
  };
}

export function applyPaymentSweepFilters<
  T extends { customerId?: string | null; status: string },
>(
  prompt: string,
  params: Record<string, unknown>,
  bookings: T[],
): { params: Record<string, unknown>; bookings: T[] } {
  const enriched = enrichPaymentSweepParams(prompt, params);
  return {
    params: enriched,
    bookings: filterBookingsForPaymentSweep(bookings, enriched),
  };
}
