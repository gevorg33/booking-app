import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicSpecimen } from '../clinic-test-results/entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { PatientEncounter } from '../patient-clinical-profiles/entities/patient-encounter.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ClinicTask } from './entities/clinic-task.entity.js';
import { ClinicTaskAutoScheduler } from './clinic-task-auto.scheduler.js';
import { ClinicTaskAutoService } from './clinic-task-auto.service.js';
import { ClinicTasksController } from './clinic-tasks.controller.js';
import { ClinicTasksService } from './clinic-tasks.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicTask,
      Employee,
      Customer,
      Booking,
      ClinicTestOrder,
      ClinicTestResult,
      ClinicSpecimen,
      PatientEncounter,
      Business,
      Service,
    ]),
    BusinessModule,
  ],
  controllers: [ClinicTasksController],
  providers: [
    ClinicTasksService,
    ClinicTaskAutoService,
    ClinicTaskAutoScheduler,
  ],
  exports: [ClinicTasksService, ClinicTaskAutoService],
})
export class ClinicTasksModule {}
