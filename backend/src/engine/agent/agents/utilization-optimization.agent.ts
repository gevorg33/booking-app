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
export class UtilizationOptimizationAgent implements AgentHandler {
  type = AgentType.UTILIZATION_OPTIMIZATION;

  constructor(private llm: LlmService) {}

  async handle(context: AgentContext, intent: string): Promise<AgentResult> {
    const llmResult = await this.llm.buildPlan(AgentType.UTILIZATION_OPTIMIZATION, intent, context);
    if (llmResult) {
      return {
        plan: {
          id: crypto.randomUUID(),
          agentType: AgentType.UTILIZATION_OPTIMIZATION,
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

    return { plan: this.buildPlan(context, intent), executionMode: 'requires_approval' };
  }

  private buildPlan(context: AgentContext, intent: string): AgentPlan {
    const analyzeId = crypto.randomUUID();
    const gapsId = crypto.randomUUID();
    const recommendId = crypto.randomUUID();
    const templateId = crypto.randomUUID();

    const employeeCount = context.employees?.length ?? 0;
    const bookingCount = context.bookings?.length ?? 0;
    const templateNames = (context.templates ?? []).map((t: any) => t.name).slice(0, 3);

    return {
      id: crypto.randomUUID(),
      agentType: AgentType.UTILIZATION_OPTIMIZATION,
      businessId: context.businessId,
      intent,
      reasoning: [
        `Utilization review for "${intent}".`,
        `${employeeCount} active provider(s), ${bookingCount} booking(s) in range.`,
        templateNames.length
          ? `Available templates: ${templateNames.join(', ')}.`
          : 'No schedule templates configured yet.',
      ].join(' '),
      steps: [
        {
          id: analyzeId,
          action: 'analyze_utilization',
          description: 'Measure utilization per provider for the selected period',
          params: { businessId: context.businessId, dateRange: context.dateRange },
          dependsOn: [],
          estimatedImpact: 'Read-only analysis',
        },
        {
          id: gapsId,
          action: 'identify_schedule_gaps',
          description: 'Find underutilized blocks below 60% utilization',
          params: {
            businessId: context.businessId,
            dateRange: context.dateRange,
            minUtilizationThreshold: 0.6,
          },
          dependsOn: [analyzeId],
          estimatedImpact: 'Read-only analysis',
        },
        {
          id: recommendId,
          action: 'generate_optimization_recommendations',
          description: 'Recommend schedule changes and gap-fill actions',
          params: { businessId: context.businessId, optimizationGoal: intent },
          dependsOn: [gapsId],
          estimatedImpact: 'Generates recommendations',
        },
        {
          id: templateId,
          action: 'summarize_utilization',
          description: 'Summarize who is under/over utilized and suggest template adjustments',
          params: { businessId: context.businessId, dateRange: context.dateRange },
          dependsOn: [recommendId],
          estimatedImpact: 'Read-only summary for owner review',
        },
      ],
      constraints: [
        'Prefer template changes over manual one-off blocks',
        'Do not cancel confirmed bookings',
        'Target providers below 50% utilization first',
      ],
      riskAssessment: {
        level: bookingCount > 20 ? 'medium' : 'low',
        factors: [
          `${employeeCount} provider(s) in scope`,
          `${bookingCount} active booking(s) in period`,
          templateNames.length ? 'May recommend template application' : 'No templates to apply',
        ],
      },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }
}
