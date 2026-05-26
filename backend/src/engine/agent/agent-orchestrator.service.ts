import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentTask } from './agent-task.entity.js';
import { AgentRegistryService } from './agent-registry.service.js';
import { AgentType, AgentContext, PlanStatus } from './interfaces/agent.interfaces.js';
import { PolicyEngineService } from '../policy/policy-engine.service.js';
import { PolicyDecision } from '../policy/policy.interfaces.js';
import { WorkflowCompilerService } from '../workflow/compiler/workflow-compiler.service.js';
import { WorkflowExecutorService } from '../workflow/executor/workflow-executor.service.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    @InjectRepository(AgentTask)
    private taskRepo: Repository<AgentTask>,
    private registry: AgentRegistryService,
    private policyEngine: PolicyEngineService,
    private workflowCompiler: WorkflowCompilerService,
    private workflowExecutor: WorkflowExecutorService,
    private eventStore: EventStoreService,
  ) {}

  async processIntent(params: {
    agentType: AgentType;
    businessId: string;
    intent: string;
    context: AgentContext;
    userId?: string;
    autoExecute?: boolean;
  }): Promise<AgentTask> {
    const task = this.taskRepo.create({
      agentType: params.agentType,
      businessId: params.businessId,
      intent: params.intent,
      status: PlanStatus.DRAFT,
      context: params.context as any,
      userId: params.userId,
    });
    await this.taskRepo.save(task);

    try {
      // Step 1: Get agent and generate plan
      const agent = this.registry.get(params.agentType);
      const result = await agent.handle(params.context, params.intent);

      task.plan = result.plan;
      task.status = PlanStatus.PENDING_VALIDATION;
      await this.taskRepo.save(task);

      await this.eventStore.publish({
        eventType: EventType.AGENT_PLAN_GENERATED,
        aggregateType: 'agent_task',
        aggregateId: task.id,
        businessId: params.businessId,
        payload: {
          agentType: params.agentType,
          intent: params.intent,
          stepCount: result.plan.steps.length,
          riskLevel: result.plan.riskAssessment.level,
        },
        userId: params.userId,
      });

      // Step 2: Validate against policy engine
      const policyResult = await this.policyEngine.evaluate({
        userId: params.userId,
        businessId: params.businessId,
        action: `agent:${params.agentType}`,
        resource: 'schedule',
        params: {
          affectedBookingsCount: result.plan.steps.length,
          planRiskLevel: result.plan.riskAssessment.level,
        },
      });

      if (policyResult.decision === PolicyDecision.DENY) {
        task.status = PlanStatus.REJECTED;
        task.result = { policyResult } as any;
        await this.taskRepo.save(task);

        await this.eventStore.publish({
          eventType: EventType.AGENT_PLAN_REJECTED,
          aggregateType: 'agent_task',
          aggregateId: task.id,
          businessId: params.businessId,
          payload: { reason: policyResult.violations },
          userId: params.userId,
        });

        return task;
      }

      task.status = PlanStatus.VALIDATED;
      await this.taskRepo.save(task);

      await this.eventStore.publish({
        eventType: EventType.AGENT_PLAN_VALIDATED,
        aggregateType: 'agent_task',
        aggregateId: task.id,
        businessId: params.businessId,
        payload: { policyDecision: policyResult.decision },
        userId: params.userId,
      });

      // Step 3: If auto-execute and allowed, compile and execute workflow
      if (
        params.autoExecute &&
        (policyResult.decision === PolicyDecision.ALLOW ||
          result.executionMode === 'autonomous')
      ) {
        return this.executeTask(task);
      }

      return task;
    } catch (error: any) {
      task.status = PlanStatus.FAILED;
      task.error = error.message;
      await this.taskRepo.save(task);
      throw error;
    }
  }

  async executeTask(task: AgentTask): Promise<AgentTask> {
    if (!task.plan) {
      throw new BadRequestException('Task has no plan to execute');
    }

    task.status = PlanStatus.EXECUTING;
    await this.taskRepo.save(task);

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_EXECUTING,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: task.businessId,
      payload: { planId: task.plan.id },
      userId: task.userId,
    });

    try {
      const workflowDef = this.workflowCompiler.compilePlanToWorkflow(task.plan);
      const executionResult = await this.workflowExecutor.executeWorkflow(workflowDef);

      task.workflowExecutionId = executionResult.workflowId;
      task.status = PlanStatus.COMPLETED;
      task.result = executionResult as any;
      await this.taskRepo.save(task);

      return task;
    } catch (error: any) {
      task.status = PlanStatus.FAILED;
      task.error = error.message;
      await this.taskRepo.save(task);
      throw error;
    }
  }

  async approveAndExecute(taskId: string, userId: string): Promise<AgentTask> {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });

    if (task.status !== PlanStatus.VALIDATED) {
      throw new BadRequestException(`Task is in ${task.status} state, cannot execute`);
    }

    return this.executeTask(task);
  }

  async getTask(id: string): Promise<AgentTask> {
    return this.taskRepo.findOneOrFail({ where: { id } });
  }

  async getTasks(businessId: string, status?: PlanStatus): Promise<AgentTask[]> {
    const where: any = { businessId };
    if (status) where.status = status;
    return this.taskRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }
}
