import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTask } from './agent-task.entity.js';
import { AgentRegistryService } from './agent-registry.service.js';
import { AgentOrchestratorService } from './agent-orchestrator.service.js';
import { LlmService } from './llm.service.js';
import { SchedulingOptimizationAgent } from './agents/scheduling-optimization.agent.js';
import { CancellationRecoveryAgent } from './agents/cancellation-recovery.agent.js';
import { ConflictResolutionAgent } from './agents/conflict-resolution.agent.js';
import { ScheduleApplyAgent } from './agents/schedule-apply.agent.js';
import { PolicyModule } from '../policy/policy.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentTask]),
    PolicyModule,
    WorkflowModule,
    EventStoreModule,
  ],
  providers: [
    AgentRegistryService,
    AgentOrchestratorService,
    LlmService,
    SchedulingOptimizationAgent,
    CancellationRecoveryAgent,
    ConflictResolutionAgent,
    ScheduleApplyAgent,
  ],
  exports: [AgentOrchestratorService, AgentRegistryService],
})
export class AgentModule implements OnModuleInit {
  constructor(
    private registry: AgentRegistryService,
    private schedulingAgent: SchedulingOptimizationAgent,
    private cancellationAgent: CancellationRecoveryAgent,
    private conflictAgent: ConflictResolutionAgent,
  ) {}

  onModuleInit() {
    this.registry.register(this.schedulingAgent);
    this.registry.register(this.cancellationAgent);
    this.registry.register(this.conflictAgent);
  }
}
