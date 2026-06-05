import { Injectable, BadRequestException } from '@nestjs/common';
import {
  WorkflowDefinition,
  WorkflowStep,
} from '../interfaces/workflow.interfaces.js';
import { AgentPlan } from '../../agent/interfaces/agent.interfaces.js';

@Injectable()
export class WorkflowCompilerService {
  compilePlanToWorkflow(plan: AgentPlan): WorkflowDefinition {
    this.validateDAG(
      plan.steps.map((s) => ({ id: s.id, dependsOn: s.dependsOn })),
    );

    const steps: WorkflowStep[] = plan.steps.map((step) => ({
      id: step.id,
      name: step.description,
      action: step.action,
      params: { businessId: plan.businessId, ...step.params },
      dependsOn: step.dependsOn,
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
      },
    }));

    return {
      id: crypto.randomUUID(),
      name: `${plan.agentType}_${plan.id}`,
      businessId: plan.businessId,
      steps,
      triggeredBy: `agent:${plan.agentType}`,
      context: {
        planId: plan.id,
        intent: plan.intent,
        businessId: plan.businessId,
      },
    };
  }

  private validateDAG(steps: { id: string; dependsOn: string[] }[]): void {
    const stepIds = new Set(steps.map((s) => s.id));

    for (const step of steps) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          throw new BadRequestException(
            `Step ${step.id} depends on unknown step ${dep}`,
          );
        }
      }
    }

    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visiting.has(id)) {
        throw new BadRequestException(
          `Circular dependency detected involving step ${id}`,
        );
      }
      if (visited.has(id)) return;

      visiting.add(id);
      const step = steps.find((s) => s.id === id);
      if (step) {
        for (const dep of step.dependsOn) {
          visit(dep);
        }
      }
      visiting.delete(id);
      visited.add(id);
    };

    steps.forEach((s) => visit(s.id));
  }

  buildSimpleWorkflow(
    name: string,
    businessId: string,
    steps: Omit<WorkflowStep, 'retryPolicy'>[],
    triggeredBy: string,
  ): WorkflowDefinition {
    return {
      id: crypto.randomUUID(),
      name,
      businessId,
      steps: steps.map((s) => ({
        ...s,
        retryPolicy: { maxRetries: 2, backoffMs: 1000 },
      })),
      triggeredBy,
      context: {},
    };
  }
}
