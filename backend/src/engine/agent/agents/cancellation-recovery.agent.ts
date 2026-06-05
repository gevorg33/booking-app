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
import { CancellationRecoveryGraphService } from '../../langgraph/services/cancellation-recovery-graph.service.js';

@Injectable()
export class CancellationRecoveryAgent implements AgentHandler {
  private readonly logger = new Logger(CancellationRecoveryAgent.name);
  type = AgentType.CANCELLATION_RECOVERY;

  constructor(
    private llm: LlmService,
    private router: BookingAgentRouterService,
    private cancellationGraph: CancellationRecoveryGraphService,
  ) {}

  async handle(context: AgentContext, intent: string): Promise<AgentResult> {
    if (this.router.useLangGraph(AgentType.CANCELLATION_RECOVERY)) {
      try {
        const result = await this.cancellationGraph.run(context, intent);
        this.logger.log(
          `LangGraph cancellation recovery plan: ${result.plan.steps.length} steps, mode=${result.executionMode}`,
        );
        return result;
      } catch (err: any) {
        this.logger.warn(
          `LangGraph cancellation recovery failed, falling back to LLM: ${err?.message ?? err}`,
        );
      }
    }

    const llmResult = await this.llm.buildPlan(
      AgentType.CANCELLATION_RECOVERY,
      intent,
      context,
    );
    if (llmResult) {
      return {
        plan: {
          id: crypto.randomUUID(),
          agentType: AgentType.CANCELLATION_RECOVERY,
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
    const findSlotsId = crypto.randomUUID();
    const findCandidatesId = crypto.randomUUID();
    const proposeId = crypto.randomUUID();

    return {
      id: crypto.randomUUID(),
      agentType: AgentType.CANCELLATION_RECOVERY,
      businessId: context.businessId,
      intent,
      reasoning: `Processing cancellation recovery: "${intent}". Will find the freed slot, identify potential candidates, and propose reassignment.`,
      steps: [
        {
          id: findSlotsId,
          action: 'find_freed_slots',
          description: 'Identify newly available slots from cancellations',
          params: {
            businessId: context.businessId,
            dateRange: context.dateRange,
          },
          dependsOn: [],
          estimatedImpact: 'Read-only',
        },
        {
          id: findCandidatesId,
          action: 'find_rebooking_candidates',
          description: 'Find customers on waitlist or with flexible bookings',
          params: {
            businessId: context.businessId,
          },
          dependsOn: [findSlotsId],
          estimatedImpact: 'Read-only',
        },
        {
          id: proposeId,
          action: 'propose_reassignment',
          description: 'Propose optimal rebooking assignments',
          params: {
            businessId: context.businessId,
          },
          dependsOn: [findCandidatesId],
          estimatedImpact: 'Generates proposals for review',
        },
      ],
      constraints: [
        'Must notify affected customers',
        'Must respect customer preferences',
        'Must not create new conflicts',
      ],
      riskAssessment: {
        level: 'medium',
        factors: [
          'Involves customer communication',
          'May modify bookings after approval',
        ],
      },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };
  }
}
