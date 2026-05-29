import { Injectable, Logger } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';
import {
  AgentContext,
  AgentResult,
  AgentType,
  PlanStatus,
} from '../../agent/interfaces/agent.interfaces.js';
import { OpenAiGatewayService } from '../../../modules/integrations/openai/openai-gateway.service.js';
import {
  CancellationRecoveryGraphState,
  CancellationRecoveryState,
  RecoveryStepIds,
} from '../interfaces/cancellation-recovery-state.js';
import { AgentToolBridgeService } from './agent-tool-bridge.service.js';

@Injectable()
export class CancellationRecoveryGraphService {
  private readonly logger = new Logger(CancellationRecoveryGraphService.name);
  private readonly graph;

  constructor(
    private readonly toolBridge: AgentToolBridgeService,
    private readonly openAi: OpenAiGatewayService,
  ) {
    this.graph = this.buildGraph();
  }

  async run(context: AgentContext, intent: string): Promise<AgentResult> {
    const stepIds: RecoveryStepIds = {
      findSlots: crypto.randomUUID(),
      findCandidates: crypto.randomUUID(),
      propose: crypto.randomUUID(),
    };

    const finalState = (await this.graph.invoke({
      businessId: context.businessId,
      intent,
      dateRange: context.dateRange,
      stepIds,
      toolContext: { businessId: context.businessId },
      freedSlots: [],
      candidateCount: 0,
      proposalCount: 0,
      reasoning: '',
      skipRecovery: false,
    })) as CancellationRecoveryGraphState;

    return this.toAgentResult(finalState, context, intent, stepIds);
  }

  private buildGraph() {
    const graph = new StateGraph(CancellationRecoveryState)
      .addNode('find_freed_slots', (state) => this.nodeFindFreedSlots(state))
      .addNode('find_rebooking_candidates', (state) => this.nodeFindCandidates(state))
      .addNode('propose_reassignment', (state) => this.nodeProposeReassignment(state))
      .addNode('summarize', (state) => this.nodeSummarize(state))
      .addEdge(START, 'find_freed_slots')
      .addConditionalEdges('find_freed_slots', (state) =>
        state.freedSlots.length > 0 ? 'find_rebooking_candidates' : 'summarize',
      )
      .addEdge('find_rebooking_candidates', 'propose_reassignment')
      .addEdge('propose_reassignment', 'summarize')
      .addEdge('summarize', END);

    return graph.compile();
  }

  private async nodeFindFreedSlots(state: CancellationRecoveryGraphState) {
    const params: Record<string, unknown> = {
      businessId: state.businessId,
    };
    if (state.dateRange) {
      params.dateRange = state.dateRange;
    }

    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.findSlots,
        action: 'find_freed_slots',
        params,
      },
      state.toolContext,
    );

    const freedSlots = (result as { freedSlots?: unknown[] })?.freedSlots ?? [];
    return {
      toolContext: ctx,
      freedSlots,
      skipRecovery: freedSlots.length === 0,
    };
  }

  private async nodeFindCandidates(state: CancellationRecoveryGraphState) {
    const params: Record<string, unknown> = {
      businessId: state.businessId,
    };
    if (state.dateRange) {
      params.dateRange = state.dateRange;
    }

    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.findCandidates,
        action: 'find_rebooking_candidates',
        params,
        dependsOn: [state.stepIds.findSlots],
      },
      state.toolContext,
    );

    const candidates = (result as { candidates?: unknown[] })?.candidates ?? [];
    return {
      toolContext: ctx,
      candidateCount: candidates.length,
    };
  }

  private async nodeProposeReassignment(state: CancellationRecoveryGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.propose,
        action: 'propose_reassignment',
        params: { businessId: state.businessId },
        dependsOn: [state.stepIds.findCandidates],
      },
      state.toolContext,
    );

    const proposalCount = (result as { proposalCount?: number })?.proposalCount ?? 0;
    return {
      toolContext: ctx,
      proposalCount,
    };
  }

  private async nodeSummarize(state: CancellationRecoveryGraphState) {
    const baseReasoning = state.skipRecovery
      ? `No cancelled appointments with freed slots were found for "${state.intent}". Nothing to recover right now.`
      : `LangGraph cancellation recovery for "${state.intent}": found ${state.freedSlots.length} freed slot(s), ${state.candidateCount} rebooking candidate(s), and ${state.proposalCount} proposal(s).`;

    const llmReasoning = await this.enrichReasoning(state, baseReasoning);
    return { reasoning: llmReasoning ?? baseReasoning };
  }

  private async enrichReasoning(
    state: CancellationRecoveryGraphState,
    baseReasoning: string,
  ): Promise<string | null> {
    const available = await this.openAi.isAvailableForBusiness(state.businessId);
    if (!available) return null;

    const summary = await this.openAi.completeJson<{ reasoning: string }>(
      {
        businessId: state.businessId,
        surface: 'agent',
        operation: 'langgraph_cancellation_recovery_summarize',
        actorType: 'system',
      },
      `You summarize cancellation recovery plans for salon/spa staff.
Return JSON: { "reasoning": "2-4 sentences, actionable, mention counts" }`,
      `Intent: ${state.intent}
Discovery: ${state.freedSlots.length} freed slots, ${state.candidateCount} candidates, ${state.proposalCount} proposals.
Baseline: ${baseReasoning}`,
      { temperature: 0.2, maxTokens: 400 },
    );

    return summary?.reasoning?.trim() || null;
  }

  private toAgentResult(
    state: CancellationRecoveryGraphState,
    context: AgentContext,
    intent: string,
    stepIds: RecoveryStepIds,
  ): AgentResult {
    const dateParams = context.dateRange ? { dateRange: context.dateRange } : {};

    return {
      plan: {
        id: crypto.randomUUID(),
        agentType: AgentType.CANCELLATION_RECOVERY,
        businessId: context.businessId,
        intent,
        reasoning: state.reasoning,
        steps: [
          {
            id: stepIds.findSlots,
            action: 'find_freed_slots',
            description: 'Identify newly available slots from cancellations',
            params: { businessId: context.businessId, ...dateParams },
            dependsOn: [],
            estimatedImpact: 'Read-only',
          },
          {
            id: stepIds.findCandidates,
            action: 'find_rebooking_candidates',
            description: 'Find customers on waitlist or with flexible bookings',
            params: { businessId: context.businessId, ...dateParams },
            dependsOn: [stepIds.findSlots],
            estimatedImpact: 'Read-only',
          },
          {
            id: stepIds.propose,
            action: 'propose_reassignment',
            description: 'Propose optimal rebooking assignments',
            params: { businessId: context.businessId },
            dependsOn: [stepIds.findCandidates],
            estimatedImpact: 'Generates proposals for review',
          },
        ],
        constraints: [
          'Must notify affected customers',
          'Must respect customer preferences',
          'Must not create new conflicts',
        ],
        riskAssessment: {
          level: state.skipRecovery ? 'low' : 'medium',
          factors: state.skipRecovery
            ? ['Read-only discovery — no slots to recover']
            : ['Involves customer communication', 'May modify bookings after approval'],
        },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
      executionMode: state.skipRecovery ? 'suggestion' : 'requires_approval',
    };
  }
}
