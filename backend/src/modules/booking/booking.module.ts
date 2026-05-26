import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity.js';
import { BookingService } from './booking.service.js';
import { BookingController } from './booking.controller.js';
import { AgentController } from './agent.controller.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, SchedulingSlot, Service]),
    SchedulingEngineModule,
    EventStoreModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [BookingController, AgentController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
