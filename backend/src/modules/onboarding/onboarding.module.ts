import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { ServiceModule } from '../service/service.module.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { BusinessModule } from '../business/business.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { OnboardingService } from './onboarding.service.js';
import { OnboardingController } from './onboarding.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Employee, SchedulingSlot]),
    ServiceModule,
    ScheduleModule,
    BusinessModule,
    AgentModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
