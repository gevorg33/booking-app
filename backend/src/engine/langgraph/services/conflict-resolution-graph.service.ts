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
  ConflictResolutionGraphState,
  ConflictResolutionState,
  ConflictStepIds,
} from '../interfaces/conflict-resolution-state.js';
import { AgentToolBridgeService } from './agent-tool-bridge.service.js';

@Injectable()
export class ConflictResolutionGraphService {
  private readonly logger = new Logger(ConflictResolutionGraphService.name);
  private readonly graph;

  constructor(
    private readonly toolBridge: AgentToolBridgeService,
    private readonly openAi: OpenAiGatewayService,
  ) {
    this.graph = this.buildGraph();
  }

  async run(context: AgentContext, intent: string): Promise<AgentResult> {
    const stepIds: ConflictStepIds = {
      detect: crypto.randomUUID(),
      analyze: crypto.randomUUID(),
      propose: crypto.randomUUID(),
    };

    const finalState = (await this.graph.invoke({
      businessId: context.businessId,
      intent,
      dateRange: context.dateRange,
      stepIds,
      toolContext: { businessId: context.businessId },
      conflictCount: 0,
      optionCount: 0,
      proposalCount: 0,
      reasoning: '',
      noConflicts: false,
    })) as ConflictResolutionGraphState;

    return this.toAgentResult(finalState, context, intent, stepIds);
  }

  private buildGraph() {
    const graph = new StateGraph(ConflictResolutionState)
      .addNode('detect_conflicts', (state) => this.nodeDetect(state))
      .addNode('analyze_resolution_options', (state) => this.nodeAnalyze(state))
      .addNode('propose_resolutions', (state) => this.nodePropose(state))
      .addNode('summarize', (state) => this.nodeSummarize(state))
      .addEdge(START, 'detect_conflicts')
      .addConditionalEdges('detect_conflicts', (state) =>
        state.conflictCount > 0 ? 'analyze_resolution_options' : 'summarize',
      )
      .addEdge('analyze_resolution_options', 'propose_resolutions')
      .addEdge('propose_resolutions', 'summarize')
      .addEdge('summarize', END);

    return graph.compile();
  }

  private dateParams(state: ConflictResolutionGraphState) {
    return state.dateRange ? { dateRange: state.dateRange } : {};
  }

  private async nodeDetect(state: ConflictResolutionGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.detect,
        action: 'detect_conflicts',
        params: { businessId: state.businessId, ...this.dateParams(state) },
      },
      state.toolContext,
    );

    const conflictCount =
      (result as { conflicts?: unknown[] })?.conflicts?.length ?? 0;
    return {
      toolContext: ctx,
      conflictCount,
      noConflicts: conflictCount === 0,
    };
  }

  private async nodeAnalyze(state: ConflictResolutionGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.analyze,
        action: 'analyze_resolution_options',
        params: {
          businessId: state.businessId,
          strategies: [
            'reschedule',
            'reassign_employee',
            'cancel_lower_priority',
          ],
        },
        dependsOn: [state.stepIds.detect],
      },
      state.toolContext,
    );

    const optionCount =
      (result as { options?: unknown[] })?.options?.length ?? 0;
    return { toolContext: ctx, optionCount };
  }

  private async nodePropose(state: ConflictResolutionGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.propose,
        action: 'propose_resolutions',
        params: { businessId: state.businessId, preferMinimalDisruption: true },
        dependsOn: [state.stepIds.analyze],
      },
      state.toolContext,
    );

    const proposalCount =
      (result as { proposals?: unknown[] })?.proposals?.length ?? 0;
    return { toolContext: ctx, proposalCount };
  }

  private async nodeSummarize(state: ConflictResolutionGraphState) {
    const base = state.noConflicts
      ? `No scheduling conflicts detected for "${state.intent}".`
      : `LangGraph conflict resolution: ${state.conflictCount} conflict(s), ${state.optionCount} option(s), ${state.proposalCount} proposal(s).`;

    const enriched = await this.enrichReasoning(state, base);
    return { reasoning: enriched ?? base };
  }

  private async enrichReasoning(
    state: ConflictResolutionGraphState,
    base: string,
  ): Promise<string | null> {
    if (!(await this.openAi.isAvailableForBusiness(state.businessId)))
      return null;

    const summary = await this.openAi.completeJson<{ reasoning: string }>(
      {
        businessId: state.businessId,
        surface: 'agent',
        operation: 'langgraph_conflict_resolution_summarize',
        actorType: 'system',
      },
      `Summarize conflict resolution for staff. Return JSON: { "reasoning": "2-4 actionable sentences" }`,
      `Intent: ${state.intent}\nConflicts: ${state.conflictCount}, options: ${state.optionCount}, proposals: ${state.proposalCount}\nBaseline: ${base}`,
      { temperature: 0.2, maxTokens: 400 },
    );
    return summary?.reasoning?.trim() || null;
  }

  private toAgentResult(
    state: ConflictResolutionGraphState,
    context: AgentContext,
    intent: string,
    stepIds: ConflictStepIds,
  ): AgentResult {
    const dateParams = this.dateParams(state);

    return {
      plan: {
        id: crypto.randomUUID(),
        agentType: AgentType.CONFLICT_RESOLUTION,
        businessId: context.businessId,
        intent,
        reasoning: state.reasoning,
        steps: [
          {
            id: stepIds.detect,
            action: 'detect_conflicts',
            description:
              'Scan schedules for overlapping or conflicting bookings',
            params: { businessId: context.businessId, ...dateParams },
            dependsOn: [],
            estimatedImpact: 'Read-only scan',
          },
          {
            id: stepIds.analyze,
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
            dependsOn: [stepIds.detect],
            estimatedImpact: 'Read-only analysis',
          },
          {
            id: stepIds.propose,
            action: 'propose_resolutions',
            description: 'Propose optimal conflict resolutions',
            params: {
              businessId: context.businessId,
              preferMinimalDisruption: true,
            },
            dependsOn: [stepIds.analyze],
            estimatedImpact: 'Generates proposals for review',
          },
        ],
        constraints: [
          'Prefer minimal customer disruption',
          'Respect employee preferences',
          'Maintain service quality commitments',
        ],
        riskAssessment: state.noConflicts
          ? { level: 'low', factors: ['No conflicts found — read-only scan'] }
          : {
              level: 'medium',
              factors: [
                'May require booking modifications',
                'Customer impact possible',
              ],
            },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
      executionMode: state.noConflicts ? 'suggestion' : 'requires_approval',
    };
  }
}
