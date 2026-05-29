import { Injectable, Logger } from '@nestjs/common';
import { WorkflowExecutorService } from '../../workflow/executor/workflow-executor.service.js';
import { WorkflowStep } from '../../workflow/interfaces/workflow.interfaces.js';

export interface AgentToolRunOptions {
  stepId: string;
  action: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
}

@Injectable()
export class AgentToolBridgeService {
  private readonly logger = new Logger(AgentToolBridgeService.name);

  constructor(private readonly workflowExecutor: WorkflowExecutorService) {}

  async run(
    options: AgentToolRunOptions,
    ctx: Record<string, unknown>,
  ): Promise<{ result: unknown; ctx: Record<string, unknown> }> {
    const step: WorkflowStep = {
      id: options.stepId,
      name: options.action,
      action: options.action,
      params: options.params,
      dependsOn: options.dependsOn ?? [],
    };

    this.logger.debug(`LangGraph tool: ${options.action} (step=${options.stepId})`);

    const result = await this.workflowExecutor.runStep(step, ctx);
    return {
      result,
      ctx: { ...ctx, [`step_${options.stepId}_result`]: result },
    };
  }
}
