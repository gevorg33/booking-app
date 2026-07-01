import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { CustomerService } from './customer.service.js';
import { CustomerController } from './customer.controller.js';
import { CustomerPrivacyService } from './customer-privacy.service.js';
import { CustomerRebookingCadenceService } from './customer-rebooking-cadence.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Booking])],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerPrivacyService,
    CustomerRebookingCadenceService,
  ],
  exports: [
    CustomerService,
    CustomerPrivacyService,
    CustomerRebookingCadenceService,
  ],
})
export class CustomerModule {}
