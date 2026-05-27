import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowCompilerService } from './compiler/workflow-compiler.service.js';
import { WorkflowExecutorService } from './executor/workflow-executor.service.js';
import { WorkflowStepExecutorsService } from './executor/workflow-step-executors.service.js';
import { WorkflowExecution } from './workflow-execution.entity.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { BookingModule } from '../../modules/booking/booking.module.js';
import { SchedulingEngineModule } from '../scheduling/scheduling-engine.module.js';
import { Booking } from '../../modules/booking/entities/booking.entity.js';
import { Employee } from '../../modules/employee/entities/employee.entity.js';

import { SchedulingPeriod } from '../../modules/schedule/entities/scheduling-period.entity.js';
import { ServiceModule } from '../../modules/service/service.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowExecution, Booking, Employee, SchedulingPeriod]),
    EventStoreModule,
    forwardRef(() => BookingModule),
    forwardRef(() => SchedulingEngineModule),
    forwardRef(() => ServiceModule),
  ],
  providers: [WorkflowCompilerService, WorkflowExecutorService, WorkflowStepExecutorsService],
  exports: [WorkflowCompilerService, WorkflowExecutorService],
})
export class WorkflowModule {}
