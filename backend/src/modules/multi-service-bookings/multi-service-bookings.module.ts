import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiServiceBookingGroup } from './entities/multi-service-booking-group.entity.js';
import { MultiServiceBookingsService } from './multi-service-bookings.service.js';
import { MultiServiceBookingsController } from './multi-service-bookings.controller.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MultiServiceBookingGroup, Business, Service]),
  ],
  controllers: [MultiServiceBookingsController],
  providers: [MultiServiceBookingsService],
  exports: [MultiServiceBookingsService],
})
export class MultiServiceBookingsModule {}
