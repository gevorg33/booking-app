import { AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';

export interface SwapSchedulePeriod {
  startTime: string;
  endTime: string;
  type: string;
  serviceIds?: string[];
  placeholderLabel?: string | null;
}

export function buildSwapSchedulesPlanSteps(params: {
  businessId: string;
  swaps: Array<{
    date: string;
    employeeA: { id: string; name: string; periods: SwapSchedulePeriod[] };
    employeeB: { id: string; name: string; periods: SwapSchedulePeriod[] };
  }>;
  userId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  const steps: AgentPlanStep[] = [];

  for (const swap of params.swaps) {
    const clearAId = nextId();
    const clearBId = nextId();
    steps.push(
      {
        id: clearAId,
        action: 'clear_schedule',
        description: `Clear ${swap.employeeA.name}'s schedule on ${swap.date}`,
        params: {
          businessId: params.businessId,
          employeeId: swap.employeeA.id,
          date: swap.date,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: `Removes ${swap.employeeA.name}'s periods on ${swap.date}`,
      },
      {
        id: clearBId,
        action: 'clear_schedule',
        description: `Clear ${swap.employeeB.name}'s schedule on ${swap.date}`,
        params: {
          businessId: params.businessId,
          employeeId: swap.employeeB.id,
          date: swap.date,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: `Removes ${swap.employeeB.name}'s periods on ${swap.date}`,
      },
      {
        id: nextId(),
        action: 'create_direct_schedule',
        description: `Apply ${swap.employeeB.name}'s hours to ${swap.employeeA.name} on ${swap.date}`,
        params: {
          businessId: params.businessId,
          employeeId: swap.employeeA.id,
          date: swap.date,
          periods: swap.employeeB.periods,
          userId: params.userId,
        },
        dependsOn: [clearAId, clearBId],
        estimatedImpact: `Swapped schedule onto ${swap.employeeA.name}`,
      },
      {
        id: nextId(),
        action: 'create_direct_schedule',
        description: `Apply ${swap.employeeA.name}'s hours to ${swap.employeeB.name} on ${swap.date}`,
        params: {
          businessId: params.businessId,
          employeeId: swap.employeeB.id,
          date: swap.date,
          periods: swap.employeeA.periods,
          userId: params.userId,
        },
        dependsOn: [clearAId, clearBId],
        estimatedImpact: `Swapped schedule onto ${swap.employeeB.name}`,
      },
    );
  }

  return steps;
}

export function buildSwapSchedulesPlanMeta(
  swaps: Array<{ employeeA: { name: string }; employeeB: { name: string } }>,
  steps: AgentPlanStep[],
) {
  const who = [...new Set(swaps.flatMap((s) => [s.employeeA.name, s.employeeB.name]))].join(' ↔ ');
  return {
    reasoning: `Swap schedules between ${who} on ${swaps.length} day(s).`,
    risk: {
      level: (steps.length > 6 ? 'high' : 'medium') as 'high' | 'medium',
      factors: ['Clears and replaces full-day schedules', 'Does not move existing bookings'],
    },
  };
}

export function buildRebalanceCapacityPlanSteps(params: {
  businessId: string;
  toName: string;
  moves: Array<{
    bookingId: string;
    label: string;
    startTime: string;
    employeeId: string;
    serviceId: string;
  }>;
  userId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  return params.moves.map((move) => ({
    id: nextId(),
    action: 'reschedule_booking',
    description: move.label,
    params: {
      businessId: params.businessId,
      bookingId: move.bookingId,
      startTime: move.startTime,
      employeeId: move.employeeId,
      serviceId: move.serviceId,
      userId: params.userId,
    },
    dependsOn: [],
    estimatedImpact: `Reassigns booking to ${params.toName}`,
  }));
}

export function buildRebalanceCapacityPlanMeta(params: {
  fromName: string;
  toName: string;
  serviceName: string;
  date: string;
  movesCount: number;
}) {
  return {
    reasoning: `Move ${params.movesCount} ${params.serviceName} slot(s) from ${params.fromName} to ${params.toName} on ${params.date}.`,
    risk: {
      level: (params.movesCount > 3 ? 'medium' : 'low') as 'medium' | 'low',
      factors: [`Reschedules ${params.movesCount} booking(s)`, 'Customer notifications may apply'],
    },
  };
}

export function mergeHolidayModeSteps(params: {
  blockSteps: AgentPlanStep[];
  extendPlans: Array<{ steps: AgentPlanStep[] }>;
}) {
  const extendSteps = params.extendPlans.flatMap((plan) => plan.steps);
  const blockStepIds = params.blockSteps.map((s) => s.id);
  const extendWithDeps = extendSteps.map((step) => ({
    ...step,
    dependsOn: [...new Set([...(step.dependsOn ?? []), ...blockStepIds])],
  }));
  return [...params.blockSteps, ...extendWithDeps];
}

export function buildHolidayModePlanMeta(params: {
  closeDates: string[];
  extendDate?: string;
  allStepsCount: number;
}) {
  const closeLabel = params.closeDates.join(', ');
  const extendLabel = params.extendDate ? `; extend ${params.extendDate} hours` : '';
  return {
    reasoning: `Holiday mode: close ${closeLabel} for all selected providers${extendLabel}.`,
    risk: {
      level: (params.allStepsCount > 8 ? 'high' : 'medium') as 'high' | 'medium',
      factors: [`${params.closeDates.length} closure day(s)`, 'May block existing availability'],
    },
  };
}

export function mergeOnboardProviderSteps(params: {
  applySteps: AgentPlanStep[];
  assignSteps: AgentPlanStep[];
}) {
  const applyStepIds = params.applySteps.map((s) => s.id);
  const assignWithDeps = params.assignSteps.map((step) => ({
    ...step,
    dependsOn: [...new Set([...(step.dependsOn ?? []), ...applyStepIds])],
  }));
  return [...params.applySteps, ...assignWithDeps];
}

export function buildOnboardProviderPlanMeta(params: {
  employeeName: string;
  templateName: string;
  serviceNames: string[];
  hasAssignPlan: boolean;
  allStepsCount: number;
}) {
  const services = params.serviceNames.length ? ` and assign ${params.serviceNames.join(', ')}` : '';
  const summary = `Set up ${params.employeeName}'s first week from ${params.templateName}${services}.`;
  return {
    reasoning: summary,
    risk: {
      level: (params.allStepsCount > 4 ? 'medium' : 'low') as 'medium' | 'low',
      factors: ['Template apply', params.hasAssignPlan ? 'Service assignment' : 'Schedule only'],
    },
  };
}
