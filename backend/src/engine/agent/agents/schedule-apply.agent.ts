import { Injectable } from '@nestjs/common';
import { AgentHandler } from '../agent-registry.service.js';
import {
  AgentType,
  AgentContext,
  AgentResult,
  AgentPlan,
  PlanStatus,
} from '../interfaces/agent.interfaces.js';
import { LlmService } from '../llm.service.js';

@Injectable()
export class ScheduleApplyAgent implements AgentHandler {
  type = AgentType.SCHEDULING_OPTIMIZATION;

  constructor(private llm: LlmService) {}

  async handle(context: AgentContext, intent: string): Promise<AgentResult> {
    const llmResult = await this.llm.buildPlan(AgentType.SCHEDULING_OPTIMIZATION, intent, context);

    if (llmResult) {
      return {
        plan: {
          id: crypto.randomUUID(),
          agentType: AgentType.SCHEDULING_OPTIMIZATION,
          businessId: context.businessId,
          intent,
          reasoning: llmResult.reasoning,
          steps: llmResult.steps,
          constraints: llmResult.constraints,
          riskAssessment: llmResult.riskAssessment,
          status: PlanStatus.DRAFT,
          createdAt: new Date(),
        },
        executionMode: llmResult.executionMode,
      };
    }

    return { plan: this.buildFallbackPlan(context, intent), executionMode: 'requires_approval' };
  }

  async analyzeTemplateApplication(context: AgentContext & {
    templateName?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    applyDays?: number[];
  }): Promise<AgentResult> {
    const intent = `Analyze and optimize template application: "${context.templateName}" for employee ${context.employeeId} from ${context.startDate} to ${context.endDate} on days ${context.applyDays?.join(',')}`;

    const llmResult = await this.llm.buildPlan(AgentType.SCHEDULING_OPTIMIZATION, intent, context);

    if (llmResult) {
      return {
        plan: {
          id: crypto.randomUUID(),
          agentType: AgentType.SCHEDULING_OPTIMIZATION,
          businessId: context.businessId,
          intent,
          reasoning: llmResult.reasoning,
          steps: llmResult.steps,
          constraints: llmResult.constraints,
          riskAssessment: llmResult.riskAssessment,
          status: PlanStatus.DRAFT,
          createdAt: new Date(),
        },
        executionMode: llmResult.executionMode,
      };
    }

    return {
      plan: this.buildTemplateApplyPlan(context, intent),
      executionMode: 'autonomous',
    };
  }

  private buildTemplateApplyPlan(context: AgentContext, intent: string): AgentPlan {
    const s1 = crypto.randomUUID();
    const s2 = crypto.randomUUID();
    const s3 = crypto.randomUUID();

    return {
      id: crypto.randomUUID(),
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      businessId: context.businessId,
      intent,
      reasoning: 'Analyzing template application for optimal scheduling. Checking for conflicts, utilization, and slot distribution.',
      steps: [
        {
          id: s1,
          action: 'analyze_existing_schedule',
          description: 'Check for existing bookings and slots that would be affected',
          params: { businessId: context.businessId, dateRange: context.dateRange },
          dependsOn: [],
          estimatedImpact: 'Read-only analysis',
        },
        {
          id: s2,
          action: 'validate_template_coverage',
          description: 'Verify template covers all required service types and has proper time distribution',
          params: { businessId: context.businessId },
          dependsOn: [s1],
          estimatedImpact: 'Read-only validation',
        },
        {
          id: s3,
          action: 'apply_template_with_optimization',
          description: 'Apply template and generate slots with optimization recommendations',
          params: { businessId: context.businessId },
          dependsOn: [s2],
          estimatedImpact: 'Creates scheduling slots',
        },
      ],
      constraints: [
        'Must preserve existing confirmed bookings',
        'Must not create overlapping slots for same employee',
        'Must respect employee availability overrides',
      ],
      riskAssessment: {
        level: 'low',
        factors: ['Template application is a standard operation', 'Existing bookings are preserved'],
      },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }

  private buildFallbackPlan(context: AgentContext, intent: string): AgentPlan {
    const steps: AgentPlan['steps'] = [];

    const s1 = crypto.randomUUID();
    steps.push({
      id: s1,
      action: 'analyze_utilization',
      description: 'Analyze current schedule utilization across all employees',
      params: { businessId: context.businessId, dateRange: context.dateRange },
      dependsOn: [],
      estimatedImpact: 'Read-only analysis',
    });

    const s2 = crypto.randomUUID();
    steps.push({
      id: s2,
      action: 'identify_schedule_gaps',
      description: 'Identify underutilized time slots and scheduling gaps',
      params: { businessId: context.businessId, dateRange: context.dateRange, minUtilizationThreshold: 0.6 },
      dependsOn: [s1],
      estimatedImpact: 'Read-only analysis',
    });

    steps.push({
      id: crypto.randomUUID(),
      action: 'generate_optimization_recommendations',
      description: 'Generate scheduling recommendations based on analysis',
      params: { businessId: context.businessId, optimizationGoal: intent },
      dependsOn: [s2],
      estimatedImpact: 'Generates suggestions only',
    });

    return {
      id: crypto.randomUUID(),
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      businessId: context.businessId,
      intent,
      reasoning: `[Fallback plan] Analyzing schedule for "${intent}". Set OPENAI_API_KEY for AI-generated plans.`,
      steps,
      constraints: [
        'Must not modify existing confirmed bookings',
        'Must respect employee working hours',
        'Must maintain minimum buffer between bookings',
      ],
      riskAssessment: { level: 'low', factors: ['Read-only analysis'] },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }
}
