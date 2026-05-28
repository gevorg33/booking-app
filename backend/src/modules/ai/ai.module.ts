import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCommandService } from './ai-command.service.js';
import { AiCommandController } from './ai-command.controller.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { AiSuggestionsService } from './ai-suggestions.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { BlockSchedule } from '../schedule/entities/block-schedule.entity.js';
import { BookingModule } from '../booking/booking.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { OpenAiModule } from '../integrations/openai/openai.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Employee,
      Service,
      Customer,
      SchedulingPeriod,
      SchedulingSlot,
      ScheduleTemplate,
      BlockSchedule,
    ]),
    BookingModule,
    AgentModule,
    SchedulingEngineModule,
    OpenAiModule,
  ],
  controllers: [AiCommandController],
  providers: [
    AiCommandService,
    CommandOrchestrationService,
    OperationalPlanBuilderService,
    AiScheduleHandlersService,
    AiSuggestionsService,
    CommandCompletionPipelineService,
  ],
  exports: [CommandCompletionPipelineService],
})
export class AiModule {}
