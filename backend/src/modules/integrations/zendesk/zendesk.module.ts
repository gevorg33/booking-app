import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { BusinessModule } from '../../business/business.module.js';
import { ZendeskApiClient } from './zendesk-api.client.js';
import { ZendeskIntegrationService } from './zendesk-integration.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, Customer, Booking, Employee]),
    BusinessModule,
  ],
  providers: [ZendeskApiClient, ZendeskIntegrationService],
  exports: [ZendeskApiClient, ZendeskIntegrationService],
})
export class ZendeskModule {}
