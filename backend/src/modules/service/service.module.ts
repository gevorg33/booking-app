import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceService } from './service.service.js';
import { ServiceController } from './service.controller.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Business]), EventStoreModule, StripeIntegrationModule],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
