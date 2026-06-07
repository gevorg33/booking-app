import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity.js';
import { ServiceCategory } from './entities/service-category.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ServiceService } from './service.service.js';
import { ServiceController } from './service.controller.js';
import { ServiceCategoryService } from './service-category.service.js';
import { ServiceCategoryController } from './service-category.controller.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';
import { ClinicDiagnosticCodesModule } from '../clinic-diagnostic-codes/clinic-diagnostic-codes.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceCategory, Business]),
    EventStoreModule,
    StripeIntegrationModule,
    ClinicDiagnosticCodesModule,
  ],
  controllers: [ServiceController, ServiceCategoryController],
  providers: [ServiceService, ServiceCategoryService],
  exports: [ServiceService, ServiceCategoryService],
})
export class ServiceModule {}
