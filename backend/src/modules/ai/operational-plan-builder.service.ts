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

@Injectable()
export class OperationalPlanBuilderService {
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

  buildCancelBookingsPlan(
    businessId: string,
    bookingIds: string[],
    reason: string,
    userId?: string,
    meta?: { employeeName?: string; date?: string; services?: string[] },
  ): AgentPlan {
    const stepId = crypto.randomUUID();
    const steps: AgentPlanStep[] = [
      {
        id: stepId,
        action: 'cancel_bookings',
        description: `Cancel ${bookingIds.length} booking(s)`,
        params: { bookingIds, reason, userId },
        dependsOn: [],
        estimatedImpact: `Cancels ${bookingIds.length} booking(s)`,
      },
    ];

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
