import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCommandService } from './ai-command.service.js';
import { AiCommandController } from './ai-command.controller.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { BookingModule } from '../booking/booking.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Employee, Service, Customer, SchedulingPeriod]),
    BookingModule,
  ],
  controllers: [AiCommandController],
  providers: [AiCommandService],
})
export class AiModule {}
