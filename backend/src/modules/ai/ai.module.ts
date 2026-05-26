import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCommandService } from './ai-command.service.js';
import { AiCommandController } from './ai-command.controller.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { BookingModule } from '../booking/booking.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Employee, Service, Customer, SchedulingPeriod, SchedulingSlot]),
    BookingModule,
    AgentModule,
  ],
  controllers: [AiCommandController],
  providers: [AiCommandService, CommandOrchestrationService, OperationalPlanBuilderService],
})
export class AiModule {}
