import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicBookingController } from './public-booking.controller.js';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Service, SchedulingSlot]),
    BusinessModule,
    BookingModule,
    CustomerModule,
    SchedulingEngineModule,
    StripeIntegrationModule,
  ],
  controllers: [PublicBookingController],
  providers: [PublicBookingService, PublicBookingAssistantService],
})
export class PublicBookingModule {}
