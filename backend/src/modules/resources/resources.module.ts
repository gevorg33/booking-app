import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SchedulingResource,
  ServiceResourceRequirement,
  BookingResource,
} from './entities/scheduling-resource.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingResourcesService } from './scheduling-resources.service.js';
import { SchedulingResourcesController } from './scheduling-resources.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SchedulingResource,
      ServiceResourceRequirement,
      BookingResource,
      Booking,
      Service,
    ]),
    BusinessModule,
  ],
  controllers: [SchedulingResourcesController],
  providers: [SchedulingResourcesService],
  exports: [SchedulingResourcesService],
})
export class ResourcesModule {}
