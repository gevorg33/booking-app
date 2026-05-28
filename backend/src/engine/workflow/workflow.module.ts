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
import { Customer } from '../../modules/customer/entities/customer.entity.js';
import { Business } from '../../modules/business/entities/business.entity.js';
import { NotificationsModule } from '../../modules/notifications/notifications.module.js';

import { SchedulingPeriod } from '../../modules/schedule/entities/scheduling-period.entity.js';
import { ServiceModule } from '../../modules/service/service.module.js';
import { ScheduleModule } from '../../modules/schedule/schedule.module.js';
import { EmployeeModule } from '../../modules/employee/employee.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowExecution, Booking, Employee, SchedulingPeriod, Customer, Business]),
    EventStoreModule,
    forwardRef(() => BookingModule),
    forwardRef(() => SchedulingEngineModule),
    forwardRef(() => ServiceModule),
    forwardRef(() => ScheduleModule),
    forwardRef(() => EmployeeModule),
    forwardRef(() => NotificationsModule),
  ],
  providers: [WorkflowCompilerService, WorkflowExecutorService, WorkflowStepExecutorsService],
  exports: [WorkflowCompilerService, WorkflowExecutorService],
})
export class WorkflowModule {}
