import { Injectable } from '@nestjs/common';
import {
  AgentPlan,
  AgentPlanStep,
  AgentType,
  PlanStatus,
} from '../../engine/agent/interfaces/agent.interfaces.js';

export interface ResolvedBookingParams {
  businessId: string;
  employeeId: string;
  serviceId: string;
  customerId?: string;
  startTime: string;
  notes?: string;
  userId?: string;
  employeeName: string;
  serviceName: string;
  customerName?: string;
  date: string;
  timeSlot: string;
}

export interface ResolvedCreateServiceParams {
  businessId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes?: number;
  price: number;
  currency?: string;
  userId?: string;
}

export interface ResolvedCreateServicesParams {
  businessId: string;
  services: Omit<ResolvedCreateServiceParams, 'businessId' | 'userId'>[];
  userId?: string;
}

export interface ResolvedFillScheduleGapsParams {
  businessId: string;
  timeFrom: string;
  timeTo: string;
  periods: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    serviceIds: string[];
    serviceNames: string[];
  }>;
  userId?: string;
}

export interface ResolvedApplyScheduleParams {
  businessId: string;
  templateId: string;
  templateName: string;
  employeeIds: string[];
  employeeNames: string[];
  startDate: string;
  endDate: string;
  applyDays: number[];
  repeatWeeksCount: number;
  userId?: string;
}

export interface ResolvedBlockScheduleParams {
  businessId: string;
  blocks: Array<{
    employeeId: string;
    employeeName: string;
    isRepetitive: boolean;
    placeholder?: string;
    singleBlock?: { startTime: string; endTime: string };
    repetitiveBlock?: Record<string, any>;
  }>;
  userId?: string;
}

export interface ResolvedDirectScheduleParams {
  businessId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  periods: Array<{
    startTime: string;
    endTime: string;
    type: string;
    placeholderLabel?: string;
    serviceIds?: string[];
    maxAppointmentCount?: number;
  }>;
  userId?: string;
}

export interface ResolvedRescheduleBookingParams {
  businessId: string;
  bookingId: string;
  startTime: string;
  employeeId?: string;
  serviceId?: string;
  userId?: string;
  label: string;
}

export interface ResolvedClearScheduleParams {
  businessId: string;
  clears: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
  }>;
  userId?: string;
}

export interface ResolvedAssignServicesParams {
  businessId: string;
  employeeId: string;
  employeeName: string;
  serviceIds: string[];
  serviceNames: string[];
  userId?: string;
}

@Injectable()
export class OperationalPlanBuilderService {
  buildFillScheduleGapsPlan(params: ResolvedFillScheduleGapsParams): AgentPlan {
    const steps: AgentPlanStep[] = [];
    const byEmployeeDate = new Map<string, typeof params.periods>();

    for (const p of params.periods) {
      const key = `${p.employeeId}:${p.date}`;
      if (!byEmployeeDate.has(key)) byEmployeeDate.set(key, []);
      byEmployeeDate.get(key)!.push(p);
    }

    for (const [, group] of byEmployeeDate) {
      const first = group[0];
      steps.push({
        id: crypto.randomUUID(),
        action: 'fill_schedule_gaps',
        description: `Fill ${group.length} gap(s) for ${first.employeeName} on ${first.date}`,
        params: {
          businessId: params.businessId,
          employeeId: first.employeeId,
          date: first.date,
          periods: group.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
            serviceIds: p.serviceIds,
          })),
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: `Adds ${group.length} service block(s)`,
      });
    }

    const providerNames = [...new Set(params.periods.map((p) => p.employeeName))].join(', ');
    const periodCount = params.periods.length;

    return this.wrapPlan(params.businessId, 'fill_unused_slots', steps, {
      reasoning: `Fill ${periodCount} schedule gap(s) for ${providerNames} between ${params.timeFrom}–${params.timeTo}.`,
      risk: {
        level: periodCount > 10 ? 'medium' : 'low',
        factors: [`Adds ${periodCount} schedule period(s)`, 'Does not modify existing bookings'],
      },
    });
  }

  buildApplySchedulePlan(params: ResolvedApplyScheduleParams): AgentPlan {
    const steps: AgentPlanStep[] = params.employeeIds.map((employeeId, i) => ({
      id: crypto.randomUUID(),
      action: 'apply_template',
      description: `Apply "${params.templateName}" to ${params.employeeNames[i]}`,
      params: {
        businessId: params.businessId,
        templateId: params.templateId,
        employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        applyDays: params.applyDays,
        repeatWeeksCount: params.repeatWeeksCount,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Applies template to ${params.employeeNames[i]}`,
    }));

    return this.wrapPlan(params.businessId, 'apply_schedule', steps, {
      reasoning: `Apply template "${params.templateName}" to ${params.employeeNames.join(', ')} from ${params.startDate} to ${params.endDate}.`,
      risk: {
        level: steps.length > 2 ? 'high' : steps.length > 1 ? 'medium' : 'low',
        factors: [`Affects ${steps.length} provider(s)`, 'Replaces existing schedule on applied days'],
      },
    });
  }

  buildBlockSchedulePlan(params: ResolvedBlockScheduleParams): AgentPlan {
    const steps: AgentPlanStep[] = params.blocks.map((block) => ({
      id: crypto.randomUUID(),
      action: 'create_block_schedule',
      description: `Block time for ${block.employeeName}`,
      params: {
        businessId: params.businessId,
        employeeId: block.employeeId,
        placeholder: block.placeholder,
        isRepetitive: block.isRepetitive,
        singleBlock: block.singleBlock,
        repetitiveBlock: block.repetitiveBlock,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Creates block schedule for ${block.employeeName}`,
    }));

    return this.wrapPlan(params.businessId, 'block_schedule', steps, {
      reasoning: `Block schedule for ${params.blocks.map((b) => b.employeeName).join(', ')}.`,
      risk: {
        level: steps.length > 3 ? 'high' : steps.length > 1 ? 'medium' : 'low',
        factors: [`${steps.length} block schedule(s)`, 'May split existing service periods'],
      },
    });
  }

  buildDirectSchedulePlan(params: ResolvedDirectScheduleParams): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'create_direct_schedule',
        description: `Set direct schedule for ${params.employeeName} on ${params.date}`,
        params: {
          businessId: params.businessId,
          employeeId: params.employeeId,
          date: params.date,
          periods: params.periods,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: 'Replaces schedule for the day',
      },
    ];

    return this.wrapPlan(params.businessId, 'create_direct_schedule', steps, {
      reasoning: `Direct schedule for ${params.employeeName} on ${params.date} (${params.periods.length} period(s)).`,
      risk: { level: 'medium', factors: ['Replaces entire day schedule for provider'] },
    });
  }

  buildClearSchedulePlan(params: ResolvedClearScheduleParams): AgentPlan {
    const steps: AgentPlanStep[] = params.clears.map((entry) => ({
      id: crypto.randomUUID(),
      action: 'clear_schedule',
      description: `Clear schedule for ${entry.employeeName} on ${entry.date}`,
      params: {
        businessId: params.businessId,
        employeeId: entry.employeeId,
        date: entry.date,
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Removes schedule periods and slots for ${entry.employeeName}`,
    }));

    const who = [...new Set(params.clears.map((c) => c.employeeName))].join(', ');
    const days = [...new Set(params.clears.map((c) => c.date))].length;

    return this.wrapPlan(params.businessId, 'clear_schedule', steps, {
      reasoning: `Clear applied schedule for ${who} (${days} day(s)) — removes periods and micro-slots; bookings are not cancelled.`,
      risk: {
        level: steps.length > 3 ? 'medium' : 'low',
        factors: [`Clears ${steps.length} schedule day(s)`, 'Does not cancel existing appointments'],
      },
    });
  }

  buildRescheduleBookingPlan(params: ResolvedRescheduleBookingParams): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'reschedule_booking',
        description: params.label,
        params: {
          businessId: params.businessId,
          bookingId: params.bookingId,
          startTime: params.startTime,
          employeeId: params.employeeId,
          serviceId: params.serviceId,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: 'Reschedules one booking',
      },
    ];

    return this.wrapPlan(params.businessId, 'reschedule_booking', steps, {
      reasoning: params.label,
      risk: { level: 'low', factors: ['Single booking reschedule'] },
    });
  }

  buildAssignEmployeeServicesPlan(params: ResolvedAssignServicesParams): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'assign_employee_services',
        description: `Assign services to ${params.employeeName}`,
        params: {
          businessId: params.businessId,
          employeeId: params.employeeId,
          serviceIds: params.serviceIds,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: `Updates services for ${params.employeeName}`,
      },
    ];

    return this.wrapPlan(params.businessId, 'assign_employee_services', steps, {
      reasoning: `Assign ${params.serviceNames.join(', ')} to ${params.employeeName}.`,
      risk: { level: 'low', factors: ['Employee service assignment update'] },
    });
  }

  buildCreateBookingPlan(params: ResolvedBookingParams): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'create_booking',
        description: `Book ${params.serviceName} with ${params.employeeName}`,
        params: {
          businessId: params.businessId,
          employeeId: params.employeeId,
          serviceId: params.serviceId,
          customerId: params.customerId,
          startTime: params.startTime,
          notes: params.notes,
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: 'Creates one confirmed booking',
      },
    ];

    return this.wrapPlan(params.businessId, 'create_booking', steps, {
      reasoning: `Create booking: ${params.serviceName} with ${params.employeeName} on ${params.date} at ${params.timeSlot}.`,
      risk: { level: 'low' as const, factors: ['Single booking mutation'] },
    });
  }

  buildCreateServicePlan(params: ResolvedCreateServiceParams): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'create_service',
        description: `Add service "${params.name}"`,
        params: {
          businessId: params.businessId,
          name: params.name,
          description: params.description,
          durationMinutes: params.durationMinutes,
          bufferMinutes: params.bufferMinutes ?? 0,
          price: params.price,
          currency: params.currency ?? 'USD',
          userId: params.userId,
        },
        dependsOn: [],
        estimatedImpact: `Adds service "${params.name}" to the catalog`,
      },
    ];

    return this.wrapPlan(params.businessId, 'create_service', steps, {
      reasoning: `Create service "${params.name}" (${params.durationMinutes} min, ${params.currency ?? 'USD'} ${params.price}).`,
      risk: { level: 'low' as const, factors: ['Single service catalog mutation'] },
    });
  }

  buildCreateServicesPlan(params: ResolvedCreateServicesParams): AgentPlan {
    const steps: AgentPlanStep[] = params.services.map((service) => ({
      id: crypto.randomUUID(),
      action: 'create_service',
      description: `Add service "${service.name}"`,
      params: {
        businessId: params.businessId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes ?? 0,
        price: service.price,
        currency: service.currency ?? 'USD',
        userId: params.userId,
      },
      dependsOn: [],
      estimatedImpact: `Adds service "${service.name}" to the catalog`,
    }));

    const names = params.services.map((s) => s.name).join(', ');
    const count = params.services.length;
    const riskLevel = count > 10 ? 'high' : count > 3 ? 'medium' : 'low';

    return this.wrapPlan(params.businessId, 'create_services', steps, {
      reasoning: `Create ${count} service(s): ${names}.`,
      risk: {
        level: riskLevel,
        factors: [`Bulk service catalog mutation (${count} items)`],
      },
    });
  }

  buildCancelBookingsPlan(
    businessId: string,
    bookingIds: string[],
    reason: string,
    userId?: string,
    meta?: { employeeName?: string; date?: string; services?: string[]; notifyCustomers?: boolean },
  ): AgentPlan {
    const cancelId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: cancelId,
        action: 'cancel_bookings',
        description: `Cancel ${bookingIds.length} booking(s)`,
        params: { bookingIds, reason, userId, businessId },
        dependsOn: [],
        estimatedImpact: `Cancels ${bookingIds.length} booking(s)`,
      },
    ];

    if (meta?.notifyCustomers) {
      steps.push({
        id: crypto.randomUUID(),
        action: 'notify_cancelled_customers',
        description: `Notify ${bookingIds.length} customer(s) about cancellation`,
        params: { bookingIds, reason, businessId },
        dependsOn: [cancelId],
        estimatedImpact: 'Sends cancellation notifications (email, SMS, WhatsApp)',
      });
    }

    const filterDesc = [
      meta?.employeeName,
      meta?.services?.join(', '),
      meta?.date,
    ]
      .filter(Boolean)
      .join(' · ');

    return this.wrapPlan(businessId, 'cancel_bookings', steps, {
      reasoning: `Cancel ${bookingIds.length} booking(s)${filterDesc ? `: ${filterDesc}` : ''}. Reason: ${reason}`,
      risk: {
        level: bookingIds.length > 5 ? 'high' : bookingIds.length > 1 ? 'medium' : 'low',
        factors: [`Affects ${bookingIds.length} booking(s)`],
      },
    });
  }

  buildHideAppointmentsPlan(
    businessId: string,
    bookingIds: string[],
    userId?: string,
    meta?: {
      employeeName?: string;
      date?: string;
      services?: string[];
      statuses?: string[];
    },
  ): AgentPlan {
    const hideId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: hideId,
        action: 'hide_appointments_from_calendar',
        description: `Hide ${bookingIds.length} appointment(s) from calendar`,
        params: { bookingIds, userId, businessId },
        dependsOn: [],
        estimatedImpact: `Hides ${bookingIds.length} appointment(s) from schedule calendar (records kept)`,
      },
    ];

    const filterDesc = [
      meta?.statuses?.join(', '),
      meta?.employeeName,
      meta?.services?.join(', '),
      meta?.date,
    ]
      .filter(Boolean)
      .join(' · ');

    return this.wrapPlan(businessId, 'hide_appointments_from_calendar', steps, {
      reasoning: `Hide ${bookingIds.length} appointment(s) from calendar${filterDesc ? `: ${filterDesc}` : ''}. Records remain in the database.`,
      risk: {
        level: bookingIds.length > 10 ? 'medium' : 'low',
        factors: [`Hides ${bookingIds.length} appointment(s) from calendar view only`],
      },
    });
  }

  buildUnhideAppointmentsPlan(
    businessId: string,
    bookingIds: string[],
    userId?: string,
    meta?: {
      employeeName?: string;
      date?: string;
      dateFrom?: string;
      dateTo?: string;
      services?: string[];
      statuses?: string[];
    },
  ): AgentPlan {
    const unhideId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: unhideId,
        action: 'unhide_appointments_from_calendar',
        description: `Restore ${bookingIds.length} appointment(s) to calendar`,
        params: { bookingIds, userId, businessId },
        dependsOn: [],
        estimatedImpact: `Restores ${bookingIds.length} hidden appointment(s) on schedule calendar`,
      },
    ];

    const periodDesc =
      meta?.dateFrom && meta?.dateTo && meta.dateFrom !== meta.dateTo
        ? `${meta.dateFrom} → ${meta.dateTo}`
        : meta?.date;
    const filterDesc = [
      meta?.statuses?.join(', '),
      meta?.employeeName,
      meta?.services?.join(', '),
      periodDesc,
    ]
      .filter(Boolean)
      .join(' · ');

    return this.wrapPlan(businessId, 'unhide_appointments_from_calendar', steps, {
      reasoning: `Restore ${bookingIds.length} hidden appointment(s) to calendar${filterDesc ? `: ${filterDesc}` : ''}.`,
      risk: {
        level: 'low',
        factors: [`Restores ${bookingIds.length} appointment(s) to calendar view only`],
      },
    });
  }

  buildBulkSmartCancelPlan(
    businessId: string,
    bookingIds: string[],
    reason: string,
    userId?: string,
    meta?: { employeeName?: string; date?: string; services?: string[]; dateRange?: { start: string; end: string } },
  ): AgentPlan {
    const cancelId = crypto.randomUUID();
    const notifyId = crypto.randomUUID();
    const freedId = crypto.randomUUID();
    const candidatesId = crypto.randomUUID();
    const proposalsId = crypto.randomUUID();

    const steps: AgentPlanStep[] = [
      {
        id: cancelId,
        action: 'cancel_bookings',
        description: `Cancel ${bookingIds.length} booking(s)`,
        params: { bookingIds, reason, userId, businessId },
        dependsOn: [],
        estimatedImpact: `Cancels ${bookingIds.length} booking(s)`,
      },
      {
        id: notifyId,
        action: 'notify_cancelled_customers',
        description: `Notify ${bookingIds.length} customer(s) about cancellation`,
        params: { bookingIds, reason, businessId },
        dependsOn: [cancelId],
        estimatedImpact: 'Sends cancellation notifications',
      },
      {
        id: freedId,
        action: 'find_freed_slots',
        description: 'Identify freed slots from cancellations',
        params: {
          businessId,
          dateRange: meta?.dateRange,
          date: meta?.date,
        },
        dependsOn: [cancelId],
        estimatedImpact: 'Maps open slots for waitlist recovery',
      },
      {
        id: candidatesId,
        action: 'find_rebooking_candidates',
        description: 'Find waitlist and rebooking candidates',
        params: { businessId, dateRange: meta?.dateRange, date: meta?.date },
        dependsOn: [freedId],
        estimatedImpact: 'Scores waitlist matches',
      },
      {
        id: proposalsId,
        action: 'propose_reassignment',
        description: 'Propose waitlist reassignments for freed slots',
        params: { businessId },
        dependsOn: [candidatesId],
        estimatedImpact: 'Generates reassignment proposals',
      },
    ];

    const filterDesc = [meta?.employeeName, meta?.services?.join(', '), meta?.date]
      .filter(Boolean)
      .join(' · ');

    return this.wrapPlan(businessId, 'bulk_smart_cancel', steps, {
      reasoning: `Smart cancel ${bookingIds.length} booking(s)${filterDesc ? `: ${filterDesc}` : ''}, notify customers, and propose waitlist recovery.`,
      risk: {
        level: bookingIds.length > 5 ? 'high' : 'medium',
        factors: [
          `Cancels ${bookingIds.length} booking(s)`,
          'Customer notifications',
          'Waitlist reassignment proposals',
        ],
      },
    });
  }

  buildFillSlotFromWaitlistPlan(params: {
    businessId: string;
    slot: {
      bookingId?: string;
      employeeId: string;
      serviceId: string;
      startTime: string;
      customerName?: string;
    };
    candidate: {
      customerId: string;
      customerName: string;
    };
    userId?: string;
  }): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'execute_reassignment',
        description: `Rebook ${params.candidate.customerName} into freed slot`,
        params: {
          businessId: params.businessId,
          proposalId: 'waitlist-auto',
          customerId: params.candidate.customerId,
          employeeId: params.slot.employeeId,
          serviceId: params.slot.serviceId,
          startTime: params.slot.startTime,
          userId: params.userId,
          notes: 'Auto-filled from waitlist via AI',
        },
        dependsOn: [],
        estimatedImpact: `Creates booking for ${params.candidate.customerName}`,
      },
    ];

    return this.wrapPlan(params.businessId, 'fill_slot_from_waitlist', steps, {
      reasoning: `Fill freed slot with waitlist customer ${params.candidate.customerName}.`,
      risk: { level: 'low', factors: ['Single waitlist auto-fill'] },
    });
  }

  buildTemplateCascadePlan(
    applyParams: ResolvedApplyScheduleParams,
    fillParams: ResolvedFillScheduleGapsParams,
  ): AgentPlan {
    const applyPlan = this.buildApplySchedulePlan(applyParams);
    const applyStepIds = applyPlan.steps.map((s) => s.id);
    const fillPlan = this.buildFillScheduleGapsPlan(fillParams);
    const fillSteps = fillPlan.steps.map((step) => ({
      ...step,
      dependsOn: [...new Set([...(step.dependsOn ?? []), ...applyStepIds])],
    }));

    const allSteps = [...applyPlan.steps, ...fillSteps];
    const providerNames = applyParams.employeeNames.join(', ');

    return this.wrapPlan(applyParams.businessId, 'setup_week_schedule', allSteps, {
      reasoning: `Template cascade: apply "${applyParams.templateName}" to ${providerNames}, then fill ${fillParams.periods.length} gap(s) between ${fillParams.timeFrom}–${fillParams.timeTo}.`,
      risk: {
        level: allSteps.length > 6 ? 'high' : allSteps.length > 3 ? 'medium' : 'low',
        factors: [
          `${applyPlan.steps.length} template apply step(s)`,
          `${fillSteps.length} gap fill step(s)`,
        ],
      },
    });
  }

  mergePlans(businessId: string, intent: string, plans: AgentPlan[]): AgentPlan {
    const allSteps: AgentPlanStep[] = [];
    let priorIds: string[] = [];

    for (const plan of plans) {
      for (const step of plan.steps) {
        allSteps.push({
          ...step,
          dependsOn: [...new Set([...(step.dependsOn ?? []), ...priorIds])],
        });
      }
      priorIds = plan.steps.map((s) => s.id);
    }

    const riskOrder = { low: 0, medium: 1, high: 2 };
    const maxRisk = plans.reduce(
      (max, p) =>
        riskOrder[p.riskAssessment.level] > riskOrder[max.riskAssessment.level] ? p : max,
      plans[0],
    );

    return this.wrapPlan(businessId, intent, allSteps, {
      reasoning: plans.map((p) => p.reasoning).filter(Boolean).join(' → '),
      risk: maxRisk.riskAssessment,
    });
  }

  private wrapPlan(
    businessId: string,
    intent: string,
    steps: AgentPlanStep[],
    meta: {
      reasoning: string;
      risk: { level: 'low' | 'medium' | 'high'; factors: string[] };
    },
  ): AgentPlan {
    return {
      id: crypto.randomUUID(),
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      businessId,
      intent,
      reasoning: meta.reasoning,
      steps,
      constraints: [
        'Must pass policy validation',
        'Must not double-book',
        'All mutations via workflow engine',
      ],
      riskAssessment: meta.risk,
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }
}
