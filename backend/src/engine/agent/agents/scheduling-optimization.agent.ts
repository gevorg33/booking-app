import { Injectable, Logger } from '@nestjs/common';
import { AgentHandler } from '../agent-registry.service.js';
import {
  AgentType,
  AgentContext,
  AgentResult,
  AgentPlan,
  PlanStatus,
} from '../interfaces/agent.interfaces.js';
import { LlmService } from '../llm.service.js';
import { BookingAgentRouterService } from '../../langgraph/services/booking-agent-router.service.js';
import { SchedulingOptimizationGraphService } from '../../langgraph/services/scheduling-optimization-graph.service.js';

@Injectable()
export class SchedulingOptimizationAgent implements AgentHandler {
  private readonly logger = new Logger(SchedulingOptimizationAgent.name);
  type = AgentType.SCHEDULING_OPTIMIZATION;

  constructor(
    private llm: LlmService,
    private router: BookingAgentRouterService,
    private optimizationGraph: SchedulingOptimizationGraphService,
  ) {}

  async handle(context: AgentContext, intent: string): Promise<AgentResult> {
    if (this.router.useLangGraph(AgentType.SCHEDULING_OPTIMIZATION)) {
      try {
        const result = await this.optimizationGraph.run(context, intent);
        this.logger.log(`LangGraph schedule optimization: mode=${result.executionMode}`);
        return result;
      } catch (err: any) {
        this.logger.warn(`LangGraph schedule optimization failed, falling back: ${err?.message ?? err}`);
      }
    }

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
      params: {
        businessId: context.businessId,
        dateRange: context.dateRange,
        minUtilizationThreshold: 0.6,
      },
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
