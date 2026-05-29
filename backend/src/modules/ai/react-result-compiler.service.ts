import { Injectable, Logger } from '@nestjs/common';
import { AIMessage, BaseMessage, isAIMessage } from '@langchain/core/messages';
import {
  AgentPlan,
  AgentType,
  PlanStatus,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import type { AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { CommandResult } from './command-completion.types.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';

export interface ReactCompileInput {
  businessId: string;
  userId?: string;
  prompt: string;
  messages: BaseMessage[];
  proposals: AgentPlanStep[];
}

@Injectable()
export class ReactResultCompilerService {
  private readonly logger = new Logger(ReactResultCompilerService.name);

  constructor(private readonly orchestration: CommandOrchestrationService) {}

  async compile(input: ReactCompileInput): Promise<CommandResult> {
    if (input.proposals.length > 0) {
      return this.compilePlanResult(input);
    }
    return this.compileReadOnlyResult(input);
  }

  private async compilePlanResult(input: ReactCompileInput): Promise<CommandResult> {
    const plan: AgentPlan = {
      id: crypto.randomUUID(),
      agentType: AgentType.SCHEDULING_OPTIMIZATION,
      businessId: input.businessId,
      intent: input.prompt,
      reasoning: this.extractFinalText(input.messages) ?? 'ReAct agent proposed mutating steps.',
      steps: this.normalizeProposalDependencies(input.proposals),
      constraints: [
        'All mutations require explicit user approval',
        'Verify booking IDs and dates before approving',
      ],
      riskAssessment: {
        level: 'medium',
        factors: ['ReAct agent proposed schedule/booking changes'],
      },
      status: PlanStatus.DRAFT,
      createdAt: new Date(),
    };

    const orch = await this.orchestration.executePlan({
      plan,
      businessId: input.businessId,
      userId: input.userId,
      autoExecute: false,
    });

    return {
      success: orch.success,
      action: 'react_agent',
      summary: orch.summary,
      details: {
        ...orch.details,
        langGraphPath: 'react_agent',
        toolOrchestration: true,
        proposedSteps: plan.steps.map((s) => s.action),
        requiresApproval: orch.requiresApproval ?? true,
        taskId: orch.taskId,
      },
    };
  }

  private compileReadOnlyResult(input: ReactCompileInput): CommandResult {
    const text =
      this.extractFinalText(input.messages) ??
      'Completed analysis but no summary was generated.';

    return {
      success: true,
      action: 'react_agent',
      summary: text,
      details: {
        langGraphPath: 'react_agent',
        toolOrchestration: true,
        readOnly: true,
      },
    };
  }

  private extractFinalText(messages: BaseMessage[]): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (isAIMessage(msg) && typeof msg.content === 'string' && msg.content.trim()) {
        if (msg.tool_calls?.length) continue;
        return msg.content.trim();
      }
      if (msg instanceof AIMessage && Array.isArray(msg.content)) {
        const textParts = msg.content
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('');
        if (textParts.trim() && !msg.tool_calls?.length) return textParts.trim();
      }
    }
    return null;
  }

  private normalizeProposalDependencies(steps: AgentPlanStep[]): AgentPlanStep[] {
    if (steps.length <= 1) {
      return steps.map((s) => ({ ...s, dependsOn: s.dependsOn ?? [] }));
    }
    return steps.map((s, i) => ({
      ...s,
      dependsOn:
        s.dependsOn && s.dependsOn.length > 0
          ? s.dependsOn
          : i === 0
            ? []
            : [steps[i - 1]!.id],
    }));
  }
}
