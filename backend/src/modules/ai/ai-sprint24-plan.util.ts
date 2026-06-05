import { AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

export function buildNoShowRecoveryPlanSteps(params: {
  businessId: string;
  bookingIds: string[];
  userId?: string;
  date?: string;
  dateRange?: { start: string; end: string };
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  const markId = nextId();
  const freedId = nextId();
  const candidatesId = nextId();
  const proposalsId = nextId();

  return [
    {
      id: markId,
      action: 'mark_no_shows',
      description: `Mark ${params.bookingIds.length} appointment(s) as no-show`,
      params: {
        businessId: params.businessId,
        bookingIds: params.bookingIds,
        status: BookingStatus.NO_SHOW,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Marks ${params.bookingIds.length} missed appointment(s) as no-show`,
    },
    {
      id: freedId,
      action: 'find_freed_slots',
      description: 'Identify slots freed by no-shows',
      params: {
        businessId: params.businessId,
        date: params.date,
        dateRange: params.dateRange,
        includeNoShows: true,
      },
      dependsOn: [markId],
      estimatedImpact: 'Maps open slots for waitlist recovery',
    },
    {
      id: candidatesId,
      action: 'find_rebooking_candidates',
      description: 'Find waitlist and rebooking candidates',
      params: {
        businessId: params.businessId,
        date: params.date,
        dateRange: params.dateRange,
      },
      dependsOn: [freedId],
      estimatedImpact: 'Scores waitlist matches for freed slots',
    },
    {
      id: proposalsId,
      action: 'propose_reassignment',
      description: 'Propose rebooking messages for freed slots',
      params: { businessId: params.businessId },
      dependsOn: [candidatesId],
      estimatedImpact: 'Generates reassignment proposals and outreach suggestions',
    },
  ];
}

export function buildNoShowRecoveryPlanMeta(bookingCount: number) {
  return {
    reasoning: `Mark ${bookingCount} no-show(s), release slots, and suggest rebooking messages.`,
    risk: {
      level: bookingCount > 5 ? ('medium' as const) : ('low' as const),
      factors: [
        `Bulk no-show update (${bookingCount})`,
        'Waitlist recovery proposals',
      ],
    },
    requiresApproval: true,
  };
}

export function buildSickDayReplanPlanSteps(params: {
  businessId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  bookingIds: string[];
  userId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  const cancelId = nextId();
  const notifyId = nextId();
  const freedId = nextId();
  const candidatesId = nextId();
  const proposalsId = nextId();
  const blockId = nextId();
  const reason = `${params.employeeName} is unavailable (sick day)`;

  const steps: AgentPlanStep[] = [];

  if (params.bookingIds.length > 0) {
    steps.push(
      {
        id: cancelId,
        action: 'cancel_bookings',
        description: `Cancel ${params.bookingIds.length} booking(s) for ${params.employeeName}`,
        params: {
          bookingIds: params.bookingIds,
          reason,
          userId: params.userId,
          businessId: params.businessId,
        },
        dependsOn: [],
        estimatedImpact: `Cancels ${params.bookingIds.length} appointment(s)`,
      },
      {
        id: notifyId,
        action: 'notify_cancelled_customers',
        description: 'Notify customers about sick-day cancellations',
        params: { bookingIds: params.bookingIds, reason, businessId: params.businessId },
        dependsOn: [cancelId],
        estimatedImpact: 'Sends cancellation notifications',
      },
      {
        id: freedId,
        action: 'find_freed_slots',
        description: 'Identify freed slots from cancellations',
        params: { businessId: params.businessId, date: params.date },
        dependsOn: [cancelId],
        estimatedImpact: 'Maps open slots for urgent redistribution',
      },
      {
        id: candidatesId,
        action: 'find_rebooking_candidates',
        description: 'Find waitlist candidates for urgent rebooking',
        params: { businessId: params.businessId, date: params.date },
        dependsOn: [freedId],
        estimatedImpact: 'Scores waitlist matches',
      },
      {
        id: proposalsId,
        action: 'propose_reassignment',
        description: 'Propose urgent reassignments for freed slots',
        params: { businessId: params.businessId },
        dependsOn: [candidatesId],
        estimatedImpact: 'Generates reassignment proposals',
      },
    );
  }

  steps.push({
    id: blockId,
    action: 'block_schedule',
    description: `Block ${params.employeeName}'s schedule for sick day`,
    params: {
      businessId: params.businessId,
      employeeId: params.employeeId,
      date: params.date,
      timeFrom: '00:00',
      timeTo: '23:59',
      label: reason,
      userId: params.userId,
    },
    dependsOn: params.bookingIds.length > 0 ? [proposalsId] : [],
    estimatedImpact: `Blocks ${params.employeeName}'s day`,
  });

  return steps;
}

export function buildSickDayReplanPlanMeta(params: {
  employeeName: string;
  date: string;
  bookingCount: number;
}) {
  return {
    reasoning: `Sick-day replan for ${params.employeeName} on ${params.date}: cancel ${params.bookingCount} booking(s), redistribute urgent appointments, and block the day.`,
    risk: {
      level: params.bookingCount > 3 ? ('high' as const) : ('medium' as const),
      factors: [
        `Cancels ${params.bookingCount} booking(s)`,
        'Customer notifications',
        'Urgent waitlist redistribution',
        'Full-day schedule block',
      ],
    },
    requiresApproval: true,
  };
}

export interface ServicePriceUpdate {
  serviceId: string;
  serviceName: string;
  currentPrice: number;
  newPrice: number;
}

export function buildUpdateServicePricesPlanSteps(params: {
  businessId: string;
  updates: ServicePriceUpdate[];
  userId?: string;
  effectiveFrom?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  return params.updates.map((update) => ({
    id: nextId(),
    action: 'update_service',
    description: `Update ${update.serviceName} price to ${update.newPrice}`,
    params: {
      businessId: params.businessId,
      serviceId: update.serviceId,
      price: update.newPrice,
      userId: params.userId,
      effectiveFrom: params.effectiveFrom,
    },
    dependsOn: [],
    estimatedImpact: `${update.serviceName}: ${update.currentPrice} → ${update.newPrice}`,
  }));
}

export function buildUpdateServicePricesPlanMeta(params: {
  updates: ServicePriceUpdate[];
  percentChange: number;
  effectiveFrom?: string;
}) {
  const names = params.updates.map((u) => u.serviceName).join(', ');
  const effective = params.effectiveFrom ? ` from ${params.effectiveFrom}` : '';
  return {
    reasoning: `Adjust prices for ${params.updates.length} service(s) by ${params.percentChange}%${effective}: ${names}.`,
    risk: {
      level: params.updates.length > 10 ? ('high' as const) : ('medium' as const),
      factors: [`Bulk catalog price change (${params.updates.length} services)`],
    },
  };
}

export function buildStaffServiceMatrixPlanSteps(params: {
  businessId: string;
  seniorAssignments: Array<{ employeeId: string; employeeName: string; serviceIds: string[] }>;
  juniorAssignments: Array<{ employeeId: string; employeeName: string; serviceIds: string[] }>;
  serviceNames: string[];
  userId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  const steps: AgentPlanStep[] = [];

  for (const assignment of params.seniorAssignments) {
    steps.push({
      id: nextId(),
      action: 'assign_employee_services',
      description: `Assign ${params.serviceNames.join(', ')} to ${assignment.employeeName}`,
      params: {
        businessId: params.businessId,
        employeeId: assignment.employeeId,
        serviceIds: assignment.serviceIds,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Adds services to senior ${assignment.employeeName}`,
    });
  }

  for (const assignment of params.juniorAssignments) {
    steps.push({
      id: nextId(),
      action: 'assign_employee_services',
      description: `Remove ${params.serviceNames.join(', ')} from ${assignment.employeeName}`,
      params: {
        businessId: params.businessId,
        employeeId: assignment.employeeId,
        serviceIds: assignment.serviceIds,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Restricts services for ${assignment.employeeName}`,
    });
  }

  return steps;
}

export function buildStaffServiceMatrixPlanMeta(params: {
  serviceNames: string[];
  seniorCount: number;
  juniorCount: number;
}) {
  return {
    reasoning: `Staff-service matrix: assign ${params.serviceNames.join(', ')} to ${params.seniorCount} senior stylist(s) and remove from ${params.juniorCount} junior stylist(s).`,
    risk: {
      level: 'medium' as const,
      factors: [
        `Updates ${params.seniorCount + params.juniorCount} employee service assignment(s)`,
      ],
    },
  };
}

export function buildImportServicesReviewPlanSteps(params: {
  businessId: string;
  services: Array<{
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    currency?: string;
  }>;
  userId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  return params.services.map((service) => ({
    id: nextId(),
    action: 'create_service',
    description: `Review & add service "${service.name}"`,
    params: {
      businessId: params.businessId,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      bufferMinutes: 0,
      price: service.price,
      currency: service.currency ?? 'USD',
      userId: params.userId,
    },
    dependsOn: [],
    estimatedImpact: `Adds "${service.name}" to catalog after review`,
  }));
}

export function buildImportServicesReviewPlanMeta(serviceCount: number) {
  return {
    reasoning: `Import ${serviceCount} service(s) from menu — review before adding to catalog.`,
    risk: {
      level: serviceCount > 10 ? ('high' as const) : ('medium' as const),
      factors: [`OCR/menu import (${serviceCount} services)`, 'Requires human review'],
    },
    requiresApproval: true,
  };
}
