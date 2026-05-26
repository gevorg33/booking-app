import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity.js';
import { ScheduleAssignment } from './entities/schedule-assignment.entity.js';
import { ScheduleOverride } from './entities/schedule-override.entity.js';
import { SchedulingTemplatePeriod } from './entities/scheduling-template-period.entity.js';
import { SchedulingSlot } from './entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from './entities/scheduling-period.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ScheduleService } from './schedule.service.js';
import { TemplateApplyService } from './services/template-apply.service.js';
import { ScheduleController } from './schedule.controller.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleTemplate,
      ScheduleAssignment,
      ScheduleOverride,
      SchedulingTemplatePeriod,
      SchedulingSlot,
      SchedulingPeriod,
      Booking,
      Employee,
    ]),
    EventStoreModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, TemplateApplyService],
  exports: [ScheduleService, TemplateApplyService],
})
export class ScheduleModule {}
