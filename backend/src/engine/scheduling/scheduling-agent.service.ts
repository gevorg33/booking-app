import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '../agent/agent-orchestrator.service.js';
import { ScheduleApplyAgent } from '../agent/agents/schedule-apply.agent.js';
import { AgentType, AgentContext } from '../agent/interfaces/agent.interfaces.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

export interface SchedulingOptimizationResult {
  optimizationApplied: boolean;
  taskId?: string;
  reasoning?: string;
  recommendations?: string[];
  riskLevel?: string;
}

@Injectable()
export class SchedulingAgentService {
  private readonly logger = new Logger(SchedulingAgentService.name);

  constructor(
    private agentOrchestrator: AgentOrchestratorService,
    private scheduleApplyAgent: ScheduleApplyAgent,
    private eventStore: EventStoreService,
  ) {}

  async optimizeTemplateApplication(params: {
    businessId: string;
    employeeId: string;
    templateName: string;
    startDate: string;
    endDate: string;
    applyDays: number[];
    userId?: string;
  }): Promise<SchedulingOptimizationResult> {
    try {
      const context: AgentContext & {
        templateName?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
        applyDays?: number[];
      } = {
        businessId: params.businessId,
        dateRange: {
          start: new Date(params.startDate),
          end: new Date(params.endDate),
        },
        templateName: params.templateName,
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        applyDays: params.applyDays,
      };

      const intent = `Optimize template "${params.templateName}" application for employee ${params.employeeId} from ${params.startDate} to ${params.endDate}. Days: ${params.applyDays.join(',')}. Analyze utilization, check for conflicts, and suggest optimal slot distribution.`;

      const agentResult = await this.scheduleApplyAgent.analyzeTemplateApplication(context);
      const task = await this.agentOrchestrator.processPlan({
        plan: agentResult.plan,
        businessId: params.businessId,
        userId: params.userId,
        autoExecute: agentResult.executionMode === 'autonomous',
      });

      this.logger.log(`Scheduling optimization task created: ${task.id}`);

      return {
        optimizationApplied: true,
        taskId: task.id,
        reasoning: task.plan?.reasoning,
        recommendations: task.plan?.steps?.map((s) => s.description) || [],
        riskLevel: task.plan?.riskAssessment?.level,
      };
    } catch (error: any) {
      this.logger.warn(`Scheduling optimization skipped: ${error.message}`);
      return { optimizationApplied: false, reasoning: error.message };
    }
  }

  async optimizeBookingCreation(params: {
    businessId: string;
    employeeId: string;
    serviceId: string;
    startTime: string;
    userId?: string;
  }): Promise<SchedulingOptimizationResult> {
    try {
      const context: AgentContext = {
        businessId: params.businessId,
        dateRange: {
          start: new Date(params.startTime),
          end: new Date(new Date(params.startTime).getTime() + 24 * 60 * 60 * 1000),
        },
      };

      const intent = `Analyze booking creation for employee ${params.employeeId}, service ${params.serviceId} at ${params.startTime}. Check for scheduling conflicts, buffer time compliance, and utilization impact.`;

      const task = await this.agentOrchestrator.processIntent({
        agentType: AgentType.SCHEDULING_OPTIMIZATION,
        businessId: params.businessId,
        intent,
        context,
        userId: params.userId,
        autoExecute: true,
      });

      return {
        optimizationApplied: true,
        taskId: task.id,
        reasoning: task.plan?.reasoning,
        recommendations: task.plan?.steps?.map((s) => s.description) || [],
        riskLevel: task.plan?.riskAssessment?.level,
      };
    } catch (error: any) {
      this.logger.warn(`Booking optimization skipped: ${error.message}`);
      return { optimizationApplied: false };
    }
  }

  async optimizeCancellation(params: {
    businessId: string;
    bookingId: string;
    employeeId: string;
    startTime: Date;
    userId?: string;
  }): Promise<SchedulingOptimizationResult> {
    try {
      const context: AgentContext = {
        businessId: params.businessId,
        dateRange: {
          start: params.startTime,
          end: new Date(params.startTime.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const task = await this.agentOrchestrator.processIntent({
        agentType: AgentType.CANCELLATION_RECOVERY,
        businessId: params.businessId,
        intent: `Booking ${params.bookingId} cancelled for employee ${params.employeeId}. Find recovery options: waitlist candidates, rebooking opportunities, or gap filling.`,
        context,
        userId: params.userId,
        autoExecute: false,
      });

      return {
        optimizationApplied: true,
        taskId: task.id,
        reasoning: task.plan?.reasoning,
        recommendations: task.plan?.steps?.map((s) => s.description) || [],
        riskLevel: task.plan?.riskAssessment?.level,
      };
    } catch (error: any) {
      this.logger.warn(`Cancellation optimization skipped: ${error.message}`);
      return { optimizationApplied: false };
    }
  }
}
