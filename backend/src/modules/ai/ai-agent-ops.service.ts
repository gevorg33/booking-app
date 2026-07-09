import { Injectable } from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import { AgentTaskUndoService } from '../../engine/agent/agent-task-undo.service.js';
import {
  rescueAgentOpsIntent,
  isListAgentTasksPrompt,
  isRebookAllFromAgentTaskPrompt,
  isUndoLatestAgentTaskPrompt,
} from './ai-agent-ops.util.js';
import {
  handleApproveAgentTaskLogic,
  handleListAgentTasksLogic,
  handleRebookAllFromAgentTaskLogic,
  handleRetryAgentStepLogic,
  handleUndoLatestAgentTaskLogic,
  type AgentOpsLogicDeps,
} from './ai-agent-ops.logic.js';

@Injectable()
export class AiAgentOpsService {
  private readonly deps: AgentOpsLogicDeps;

  constructor(
    agentOrchestrator: AgentOrchestratorService,
    agentTaskUndo: AgentTaskUndoService,
  ) {
    this.deps = { agentOrchestrator, agentTaskUndo };
  }

  rescueAgentOpsIntent(prompt: string, action: string) {
    return rescueAgentOpsIntent(prompt, action);
  }

  isListAgentTasksPrompt(prompt: string) {
    return isListAgentTasksPrompt(prompt);
  }

  isRebookAllFromAgentTaskPrompt(prompt: string) {
    return isRebookAllFromAgentTaskPrompt(prompt);
  }

  isUndoLatestAgentTaskPrompt(prompt: string) {
    return isUndoLatestAgentTaskPrompt(prompt);
  }

  handleListAgentTasks(businessId: string, params: Record<string, any>) {
    return handleListAgentTasksLogic(this.deps, businessId, params);
  }

  handleRebookAllFromAgentTask(
    businessId: string,
    params: Record<string, any>,
    userId: string,
  ) {
    return handleRebookAllFromAgentTaskLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleUndoLatestAgentTask(
    businessId: string,
    userId: string,
    confirmed: boolean,
  ) {
    return handleUndoLatestAgentTaskLogic(
      this.deps,
      businessId,
      userId,
      confirmed,
    );
  }

  handleApproveAgentTask(
    businessId: string,
    params: Record<string, any>,
    userId: string,
  ) {
    return handleApproveAgentTaskLogic(this.deps, businessId, params, userId);
  }

  handleRetryAgentStep(
    businessId: string,
    params: Record<string, any>,
    userId: string,
  ) {
    return handleRetryAgentStepLogic(this.deps, businessId, params, userId);
  }
}
