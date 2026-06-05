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
import { ConflictResolutionGraphService } from '../../langgraph/services/conflict-resolution-graph.service.js';

@Injectable()
export class ConflictResolutionAgent implements AgentHandler {
  private readonly logger = new Logger(ConflictResolutionAgent.name);
  type = AgentType.CONFLICT_RESOLUTION;

  constructor(
    private llm: LlmService,
    private router: BookingAgentRouterService,
    private conflictGraph: ConflictResolutionGraphService,
  ) {}

  async handle(context: AgentContext, intent: string): Promise<AgentResult> {
    if (this.router.useLangGraph(AgentType.CONFLICT_RESOLUTION)) {
      try {
        const result = await this.conflictGraph.run(context, intent);
        this.logger.log(
          `LangGraph conflict resolution: mode=${result.executionMode}`,
        );
        return result;
      } catch (err: any) {
        this.logger.warn(
          `LangGraph conflict resolution failed, falling back: ${err?.message ?? err}`,
        );
      }
    }

    const llmResult = await this.llm.buildPlan(
      AgentType.CONFLICT_RESOLUTION,
      intent,
      context,
    );
    if (llmResult) {
      return {
        plan: {
          id: crypto.randomUUID(),
          agentType: AgentType.CONFLICT_RESOLUTION,
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
    const plan = this.buildPlan(context, intent);
    return { plan, executionMode: 'requires_approval' };
  }

  private buildPlan(context: AgentContext, intent: string): AgentPlan {
    const detectId = crypto.randomUUID();
    const analyzeId = crypto.randomUUID();
    const resolveId = crypto.randomUUID();

    return {
      id: crypto.randomUUID(),
      agentType: AgentType.CONFLICT_RESOLUTION,
      businessId: context.businessId,
      intent,
      reasoning: `Resolving scheduling conflicts: "${intent}". Will detect conflicts, analyze resolution options, and propose resolutions.`,
      steps: [
        {
          id: detectId,
          action: 'detect_conflicts',
          description: 'Scan schedules for overlapping or conflicting bookings',
          params: {
            businessId: context.businessId,
            dateRange: context.dateRange,
          },
          dependsOn: [],
          estimatedImpact: 'Read-only scan',
        },
        {
          id: analyzeId,
          action: 'analyze_resolution_options',
          description:
            'Evaluate possible resolution strategies for each conflict',
          params: {
            businessId: context.businessId,
            strategies: [
              'reschedule',
              'reassign_employee',
              'cancel_lower_priority',
            ],
          },
          dependsOn: [detectId],
          estimatedImpact: 'Read-only analysis',
        },
        {
          id: resolveId,
          action: 'propose_resolutions',
          description: 'Propose optimal conflict resolutions',
          params: {
            businessId: context.businessId,
            preferMinimalDisruption: true,
          },
          dependsOn: [analyzeId],
          estimatedImpact: 'Generates proposals for review',
        },
      ],
      constraints: [
        'Prefer minimal customer disruption',
        'Respect employee preferences',
        'Maintain service quality commitments',
      ],
      riskAssessment: {
        level: 'medium',
        factors: [
          'May require booking modifications',
          'Customer impact possible',
        ],
      },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }
}
