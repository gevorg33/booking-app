import { Between, In, Not, Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CommandResult } from './ai-command.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import {
  resolveEmployees,
  resolveTemplate,
  resolveServices,
  resolveDateRange,
  resolveScheduleDates,
  parseWeekdaysFromParams,
  shouldAutoExecute,
  resolveScheduleServicesForEmployee,
} from './ai-orchestration.helpers.js';
import {
  buildHolidayClosureBlockPayloads,
  buildExtendHoursPeriods,
  parseHolidayModeDates,
  parseRebalanceSlotCount,
  parseSwapEmployeeNames,
  resolveHolidayDatesFromBusinessSettings,
  mapSchedulingOrchestrationResult,
  resolveRebalanceTargetDate,
  selectBookingsToRebalance,
  serializePeriodsForSwap,
} from './ai-scheduling.util.js';

export interface SchedulingLogicDeps {
  templateRepo: Pick<Repository<ScheduleTemplate>, 'find'>;
  periodRepo: Pick<Repository<SchedulingPeriod>, 'find'>;
  bookingRepo: Pick<Repository<Booking>, 'find'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  orchestration: Pick<CommandOrchestrationService, 'executePlan'>;
  planBuilder: OperationalPlanBuilderService;
}

export function buildSwapSchedulesFailure(
  params: Record<string, unknown>,
): CommandResult {
  const { employeeName, swapWithEmployeeName } = parseSwapEmployeeNames(params);
  return {
    success: false,
    action: 'swap_schedules',
    summary:
      employeeName && swapWithEmployeeName
        ? `Could not swap schedules — specify when (e.g. "Friday" or a date range).`
        : 'Specify two providers to swap schedules between (e.g. Gevorg and Maria on Friday).',
    details: { params },
  };
}

export function buildRebalanceCapacityFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'rebalance_capacity',
    summary:
      'Specify source and target providers, service, date, and how many slots to move (e.g. "Move 2 facemassage slots from Gevorg to Maria on Friday").',
    details: { params },
  };
}

export function buildHolidayModeFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'holiday_mode',
    summary:
      'Specify closure dates (e.g. Dec 24–26) and optionally extended hours before closure (e.g. extend Dec 23 until 21:00).',
    details: { params },
  };
}

export function buildOnboardProviderFailure(
  params: Record<string, unknown>,
): CommandResult {
  return {
    success: false,
    action: 'onboard_provider_schedule',
    summary:
      'Specify the new provider, a weekday template, and optional services (e.g. "Set up Anna\'s first week from weekday template + assign massage services").',
    details: { params },
  };
}

export async function executeSprint23Plan(
  deps: Pick<SchedulingLogicDeps, 'orchestration'>,
  plan: AgentPlan,
  businessId: string,
  userId: string | undefined,
  providerCount = 1,
): Promise<CommandResult> {
  const result = await deps.orchestration.executePlan({
    plan,
    businessId,
    userId,
    autoExecute: shouldAutoExecute(
      plan.intent,
      plan.steps.length,
      providerCount,
    ),
  });
  return mapSchedulingOrchestrationResult(result);
}

export async function prepareSwapSchedulesPlanLogic(
  deps: SchedulingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  userId?: string,
): Promise<AgentPlan | null> {
  const { employeeName, swapWithEmployeeName } = parseSwapEmployeeNames(params);
  if (!employeeName || !swapWithEmployeeName) return null;

  const pairParams = {
    ...params,
    employeeName,
    employeeNames: [employeeName, swapWithEmployeeName],
  };
  const targets = resolveEmployees(employees, pairParams);
  if (targets.length !== 2) return null;

  const dates = resolveScheduleDates(params, prompt);
  if (!dates.length) return null;

  const swaps: Array<{
    date: string;
    employeeA: {
      id: string;
      name: string;
      periods: ReturnType<typeof serializePeriodsForSwap>;
    };
    employeeB: {
      id: string;
      name: string;
      periods: ReturnType<typeof serializePeriodsForSwap>;
    };
  }> = [];

  for (const date of dates) {
    const [employeeA, employeeB] = targets;
    const periodsA = await loadDayPeriods(
      deps.periodRepo,
      businessId,
      employeeA.id,
      date,
    );
    const periodsB = await loadDayPeriods(
      deps.periodRepo,
      businessId,
      employeeB.id,
      date,
    );
    swaps.push({
      date,
      employeeA: {
        id: employeeA.id,
        name: employeeA.name,
        periods: serializePeriodsForSwap(periodsA),
      },
      employeeB: {
        id: employeeB.id,
        name: employeeB.name,
        periods: serializePeriodsForSwap(periodsB),
      },
    });
  }

  return deps.planBuilder.buildSwapSchedulesPlan({ businessId, swaps, userId });
}

export async function prepareRebalanceCapacityPlanLogic(
  deps: SchedulingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  services: Service[],
  userId?: string,
): Promise<AgentPlan | null> {
  const names = Array.isArray(params.employeeNames)
    ? params.employeeNames
    : null;
  const sourceName =
    (params.fromEmployeeName as string | undefined) ??
    names?.[0] ??
    params.employeeName;
  const targetName =
    (params.toEmployeeName as string | undefined) ??
    (params.swapWithEmployeeName as string | undefined) ??
    names?.[1];
  if (!sourceName || !targetName) return null;

  const source = resolveEmployees(employees, { employeeName: sourceName })[0];
  const target = resolveEmployees(employees, { employeeName: targetName })[0];
  if (!source || !target) return null;

  const matchedServices = resolveServices(services, params);
  const service = matchedServices[0];
  if (!service) return null;

  const dates = resolveScheduleDates(params, prompt);
  const date = resolveRebalanceTargetDate(params, dates);
  if (!date) return null;

  const slotCount = parseRebalanceSlotCount(params, prompt);
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      employeeId: source.id,
      serviceId: service.id,
      startTime: Between(dayStart, dayEnd),
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])),
    },
    order: { startTime: 'ASC' },
  });

  const selected = selectBookingsToRebalance(
    bookings,
    slotCount,
    source.id,
    service.id,
  );
  if (!selected.length) return null;

  return deps.planBuilder.buildRebalanceCapacityPlan({
    businessId,
    fromName: source.name,
    toName: target.name,
    serviceName: service.name,
    date,
    moves: selected.map((booking) => ({
      bookingId: booking.id,
      label: `Move ${source.name}'s ${service.name} appointment to ${target.name}`,
      startTime: booking.startTime.toISOString(),
      employeeId: target.id,
      serviceId: service.id,
    })),
    userId,
  });
}

export async function prepareHolidayModePlanLogic(
  deps: SchedulingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  userId?: string,
): Promise<AgentPlan | null> {
  const allProviders =
    params.allProviders === true ||
    /all providers|everyone|all staff|for all/i.test(prompt);
  const targets = allProviders
    ? employees
    : resolveEmployees(employees, params);
  if (!targets.length) return null;

  const { closeDates, extendDate, extendTimeFrom, extendTimeTo } =
    parseHolidayModeDates(params);
  if (!closeDates.length) return null;

  const blocks = buildHolidayClosureBlockPayloads({
    employees: targets.map((e) => ({ id: e.id, name: e.name })),
    closeDates,
    placeholder:
      (params.placeholder as string | undefined) ?? 'Holiday closure',
  });

  const blockPlan = deps.planBuilder.buildBlockSchedulePlan({
    businessId,
    blocks,
    userId,
  });

  if (!extendDate || !extendTimeFrom || !extendTimeTo) {
    return deps.planBuilder.buildHolidayModePlan({
      businessId,
      blockPlan,
      extendPlans: [],
      closeDates,
      extendDate,
    });
  }

  const periods = buildExtendHoursPeriods(extendTimeFrom, extendTimeTo);
  const extendPlans = targets.map((employee) =>
    deps.planBuilder.buildDirectSchedulePlan({
      businessId,
      employeeId: employee.id,
      employeeName: employee.name,
      dates: [extendDate],
      periods,
      userId,
    }),
  );

  return deps.planBuilder.buildHolidayModePlan({
    businessId,
    blockPlan,
    extendPlans,
    closeDates,
    extendDate,
  });
}

export async function prepareOnboardProviderSchedulePlanLogic(
  deps: SchedulingLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  employees: Employee[],
  services: Service[],
  userId?: string,
): Promise<AgentPlan | null> {
  const targets = resolveEmployees(employees, params);
  if (targets.length !== 1) return null;

  const range = resolveDateRange(params, prompt);
  if (!range) return null;

  const templates = await deps.templateRepo.find({
    where: { businessId, isDeleted: false },
    order: { name: 'ASC' },
  });
  const template = resolveTemplate(templates, params.templateName);
  if (!template) return null;

  const applyDays = parseWeekdaysFromParams(params, prompt);
  const repeatWeeksCount = params.repeatWeeksCount ?? 1;

  const applyPlan = deps.planBuilder.buildApplySchedulePlan({
    businessId,
    templateId: template.id,
    templateName: template.name,
    employeeIds: [targets[0].id],
    employeeNames: [targets[0].name],
    startDate: range.start,
    endDate: range.end,
    applyDays,
    repeatWeeksCount,
    userId,
  });

  const employeeServices = resolveScheduleServicesForEmployee(
    targets[0],
    services,
    params,
    prompt,
  );
  const assignPlan =
    employeeServices.length > 0
      ? deps.planBuilder.buildAssignEmployeeServicesPlan({
          businessId,
          employeeId: targets[0].id,
          employeeName: targets[0].name,
          serviceIds: employeeServices.map((s) => s.id),
          serviceNames: employeeServices.map((s) => s.name),
          userId,
        })
      : null;

  return deps.planBuilder.buildOnboardProviderSchedulePlan({
    businessId,
    employeeName: targets[0].name,
    templateName: template.name,
    serviceNames: employeeServices.map((s) => s.name),
    applyPlan,
    assignPlan,
  });
}

export async function resolveHolidayDatesForBusinessLogic(
  businessRepo: Pick<Repository<Business>, 'findOne'>,
  businessId: string,
): Promise<string[]> {
  const business = await businessRepo.findOne({ where: { id: businessId } });
  return resolveHolidayDatesFromBusinessSettings(
    (business?.settings ?? {}) as Record<string, unknown>,
  );
}

async function loadDayPeriods(
  periodRepo: Pick<Repository<SchedulingPeriod>, 'find'>,
  businessId: string,
  employeeId: string,
  date: string,
) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);
  return periodRepo.find({
    where: {
      businessId,
      employeeId,
      startTime: Between(dayStart, dayEnd),
    },
    order: { startTime: 'ASC' },
  });
}
