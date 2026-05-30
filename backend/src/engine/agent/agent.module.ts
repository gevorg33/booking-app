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
import { UtilizationOptimizationAgent } from './agents/utilization-optimization.agent.js';
import { ContextBuilderService } from './context-builder.service.js';
import { PolicyModule } from '../policy/policy.module.js';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { OpenAiModule } from '../../modules/integrations/openai/openai.module.js';
import { LangGraphModule } from '../langgraph/langgraph.module.js';
import { Employee } from '../../modules/employee/entities/employee.entity.js';
import { Service } from '../../modules/service/entities/service.entity.js';
import { Booking } from '../../modules/booking/entities/booking.entity.js';
import { SchedulingPeriod } from '../../modules/schedule/entities/scheduling-period.entity.js';
import { ScheduleTemplate } from '../../modules/schedule/entities/schedule-template.entity.js';
import { BlockSchedule } from '../../modules/schedule/entities/block-schedule.entity.js';
import { Business } from '../../modules/business/entities/business.entity.js';
import { BookingModule } from '../../modules/booking/booking.module.js';
import { ScheduleModule } from '../../modules/schedule/schedule.module.js';
import { EmployeeModule } from '../../modules/employee/employee.module.js';
import { AgentTaskUndoService } from './agent-task-undo.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentTask, Employee, Service, Booking, SchedulingPeriod, ScheduleTemplate, BlockSchedule, Business]),
    PolicyModule,
    forwardRef(() => WorkflowModule),
    EventStoreModule,
    OpenAiModule,
    LangGraphModule,
    forwardRef(() => BookingModule),
    ScheduleModule,
    EmployeeModule,
  ],
  providers: [
    AgentRegistryService,
    AgentOrchestratorService,
    AgentTaskUndoService,
    ContextBuilderService,
    LlmService,
    SchedulingOptimizationAgent,
    CancellationRecoveryAgent,
    ConflictResolutionAgent,
    ScheduleApplyAgent,
    UtilizationOptimizationAgent,
  ],
  exports: [
    AgentOrchestratorService,
    AgentRegistryService,
    ContextBuilderService,
    LlmService,
    ScheduleApplyAgent,
    AgentTaskUndoService,
  ],
})
export class AgentModule implements OnModuleInit {
  constructor(
    private registry: AgentRegistryService,
    private schedulingAgent: SchedulingOptimizationAgent,
    private cancellationAgent: CancellationRecoveryAgent,
    private conflictAgent: ConflictResolutionAgent,
    private utilizationAgent: UtilizationOptimizationAgent,
  ) {}

  onModuleInit() {
    this.registry.register(this.schedulingAgent);
    this.registry.register(this.cancellationAgent);
    this.registry.register(this.conflictAgent);
    this.registry.register(this.utilizationAgent);
  }
}
