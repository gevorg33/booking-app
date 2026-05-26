import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity.js';
import { EmployeeService } from './employee.service.js';
import { EmployeeController } from './employee.controller.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), EventStoreModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
