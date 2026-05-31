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
import { ServicePackagesController } from './service-packages.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServicePackage,
      ServicePackageItem,
      PackagePurchase,
      Service,
      Booking,
    ]),
    BusinessModule,
  ],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService],
  exports: [ServicePackagesService],
})
export class ServicePackagesModule {}
