import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecution } from '../workflow-execution.entity.js';
import {
  WorkflowDefinition,
  WorkflowStatus,
  StepStatus,
  WorkflowStep,
  WorkflowExecutionResult,
} from '../interfaces/workflow.interfaces.js';
import { EventStoreService } from '../../../events/store/event-store.service.js';
import { EventType } from '../../../events/event-types.js';

export type StepExecutor = (
  step: WorkflowStep,
  context: Record<string, any>,
) => Promise<any>;

@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);
  private stepExecutors = new Map<string, StepExecutor>();

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepo: Repository<WorkflowExecution>,
    private eventStore: EventStoreService,
  ) {}

  registerStepExecutor(action: string, executor: StepExecutor): void {
    this.stepExecutors.set(action, executor);
  }

  async executeWorkflow(definition: WorkflowDefinition): Promise<WorkflowExecutionResult> {
    const correlationId = crypto.randomUUID();

    const execution = this.executionRepo.create({
      name: definition.name,
      businessId: definition.businessId,
      status: WorkflowStatus.RUNNING,
      steps: definition.steps,
      stepResults: {},
      context: definition.context,
      triggeredBy: definition.triggeredBy,
      correlationId,
    });

    await this.executionRepo.save(execution);

    await this.eventStore.publish({
      eventType: EventType.WORKFLOW_STARTED,
      aggregateType: 'workflow',
      aggregateId: execution.id,
      businessId: definition.businessId,
      payload: { name: definition.name, stepCount: definition.steps.length },
      correlationId,
    });

    try {
      const result = await this.executeSteps(execution, definition.steps);
      
      execution.status = WorkflowStatus.COMPLETED;
      execution.completedAt = new Date();
      await this.executionRepo.save(execution);

      await this.eventStore.publish({
        eventType: EventType.WORKFLOW_COMPLETED,
        aggregateType: 'workflow',
        aggregateId: execution.id,
        businessId: definition.businessId,
        payload: { name: definition.name },
        correlationId,
      });

      return result;
    } catch (error: any) {
      execution.status = WorkflowStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
      await this.executionRepo.save(execution);

      await this.eventStore.publish({
        eventType: EventType.WORKFLOW_FAILED,
        aggregateType: 'workflow',
        aggregateId: execution.id,
        businessId: definition.businessId,
        payload: { name: definition.name, error: error.message },
        correlationId,
      });

      return {
        workflowId: execution.id,
        status: WorkflowStatus.FAILED,
        steps: Object.entries(execution.stepResults).map(([stepId, r]) => ({
          stepId,
          status: r.status,
          result: r.result,
          error: r.error,
          startedAt: r.startedAt ? new Date(r.startedAt) : undefined,
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        })),
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
      };
    }
  }

  private async executeSteps(
    execution: WorkflowExecution,
    steps: WorkflowStep[],
  ): Promise<WorkflowExecutionResult> {
    const completed = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const context = { businessId: execution.businessId, ...execution.context };

    while (completed.size < steps.length) {
      const ready = steps.filter(
        (s) => !completed.has(s.id) && s.dependsOn.every((d) => completed.has(d)),
      );

      if (ready.length === 0 && completed.size < steps.length) {
        throw new Error('Workflow deadlock: no steps ready to execute');
      }

      for (const step of ready) {
        await this.executeStep(execution, step, context);
        completed.add(step.id);
      }
    }

    return {
      workflowId: execution.id,
      status: WorkflowStatus.COMPLETED,
      steps: Object.entries(execution.stepResults).map(([stepId, r]) => ({
        stepId,
        status: r.status,
        result: r.result,
        error: r.error,
        startedAt: r.startedAt ? new Date(r.startedAt) : undefined,
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      })),
      startedAt: execution.startedAt,
    };
  }

  private async executeStep(
    execution: WorkflowExecution,
    step: WorkflowStep,
    context: Record<string, any>,
  ): Promise<void> {
    const startedAt = new Date();
    execution.stepResults[step.id] = { status: StepStatus.RUNNING, startedAt: startedAt.toISOString() };
    await this.executionRepo.save(execution);

    const executor = this.stepExecutors.get(this.resolveAction(step.action));
    if (!executor) {
      execution.stepResults[step.id] = {
        status: StepStatus.FAILED,
        error: `No executor registered for action: ${step.action}`,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      };
      await this.executionRepo.save(execution);
      throw new Error(`No executor for action: ${step.action}`);
    }

    let lastError: Error | null = null;
    const maxRetries = step.retryPolicy?.maxRetries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executor(step, context);
        context[`step_${step.id}_result`] = result;

        execution.stepResults[step.id] = {
          status: StepStatus.COMPLETED,
          result,
          startedAt: startedAt.toISOString(),
          completedAt: new Date().toISOString(),
        };
        await this.executionRepo.save(execution);

        await this.eventStore.publish({
          eventType: EventType.WORKFLOW_STEP_COMPLETED,
          aggregateType: 'workflow',
          aggregateId: execution.id,
          businessId: execution.businessId,
          payload: { stepId: step.id, stepName: step.name, attempt },
          correlationId: execution.correlationId,
        });

        return;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Step ${step.id} attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, (step.retryPolicy?.backoffMs || 1000) * (attempt + 1)),
          );
        }
      }
    }

    if (step.compensationAction) {
      const compensator = this.stepExecutors.get(step.compensationAction);
      if (compensator) {
        try {
          execution.stepResults[step.id] = {
            ...execution.stepResults[step.id],
            status: StepStatus.COMPENSATING,
          };
          await this.executionRepo.save(execution);
          await compensator(
            { ...step, action: step.compensationAction, params: step.compensationParams || {} },
            context,
          );
          execution.stepResults[step.id] = {
            ...execution.stepResults[step.id],
            status: StepStatus.COMPENSATED,
            error: lastError?.message,
            completedAt: new Date().toISOString(),
          };
          await this.executionRepo.save(execution);
        } catch (compError: any) {
          this.logger.error(`Compensation for step ${step.id} failed: ${compError.message}`);
        }
      }
    }

    execution.stepResults[step.id] = {
      ...execution.stepResults[step.id],
      status: StepStatus.FAILED,
      error: lastError?.message,
      completedAt: new Date().toISOString(),
    };
    await this.executionRepo.save(execution);
    throw lastError;
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    return this.executionRepo.findOne({ where: { id } });
  }

  async getExecutions(businessId: string, status?: WorkflowStatus): Promise<WorkflowExecution[]> {
    const where: any = { businessId };
    if (status) where.status = status;
    return this.executionRepo.find({ where, order: { startedAt: 'DESC' }, take: 50 });
  }

  /** Map LLM-generated action names to registered executors. */
  private resolveAction(action: string): string {
    const aliases: Record<string, string> = {
      createBooking: 'create_booking',
      cancel_booking: 'cancel_bookings',
      cancelBooking: 'cancel_bookings',
      list_bookings: 'list_appointments',
      show_appointments: 'list_appointments',
      get_current_schedule: 'fetch_current_schedule',
      retrieve_schedule: 'fetch_current_schedule',
      fetch_schedule: 'fetch_current_schedule',
      analyze_schedule: 'analyze_utilization',
      optimize_schedule: 'generate_optimization_recommendations',
    };
    return aliases[action] ?? action;
  }
}
