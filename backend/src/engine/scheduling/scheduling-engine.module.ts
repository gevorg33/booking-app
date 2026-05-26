import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingEngineService } from './scheduling-engine.service.js';
import { SchedulingAgentService } from './scheduling-agent.service.js';
import { Booking } from '../../modules/booking/entities/booking.entity.js';
import { ScheduleTemplate } from '../../modules/schedule/entities/schedule-template.entity.js';
import { ScheduleAssignment } from '../../modules/schedule/entities/schedule-assignment.entity.js';
import { ScheduleOverride } from '../../modules/schedule/entities/schedule-override.entity.js';
import { Service } from '../../modules/service/entities/service.entity.js';
import { Employee } from '../../modules/employee/entities/employee.entity.js';
import { AgentModule } from '../agent/agent.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      ScheduleTemplate,
      ScheduleAssignment,
      ScheduleOverride,
      Service,
      Employee,
    ]),
    forwardRef(() => AgentModule),
    EventStoreModule,
  ],
  providers: [SchedulingEngineService, SchedulingAgentService],
  exports: [SchedulingEngineService, SchedulingAgentService],
})
export class SchedulingEngineModule {}
