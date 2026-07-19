import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ServicePackage,
  ServicePackageItem,
  PackagePurchase,
} from './entities/service-package.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { ServicePackagesService } from './service-packages.service.js';
import { PackageRefundService } from './package-refund.service.js';
import { ServicePackagesController } from './service-packages.controller.js';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';
import { CatalogAnnouncementModule } from '../catalog-announcement/catalog-announcement.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServicePackage,
      ServicePackageItem,
      PackagePurchase,
      Service,
      Booking,
      Business,
    ]),
    BusinessModule,
    StripeIntegrationModule,
    CatalogAnnouncementModule,
  ],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService, PackageRefundService],
  exports: [ServicePackagesService, PackageRefundService],
})
export class ServicePackagesModule {}
