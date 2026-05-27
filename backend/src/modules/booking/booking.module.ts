import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity.js';
import { BookingService } from './booking.service.js';
import { BookingController } from './booking.controller.js';
import { BookingCreatedListener } from './listeners/booking-created.listener.js';
import { AgentController } from './agent.controller.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, SchedulingSlot, SchedulingPeriod, Service, Customer]),
    SchedulingEngineModule,
    EventStoreModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [BookingController, AgentController],
  providers: [BookingService, BookingCreatedListener],
  exports: [BookingService],
})
export class BookingModule {}
