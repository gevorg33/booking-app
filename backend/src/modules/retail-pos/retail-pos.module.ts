import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingRetailSale } from './entities/booking-retail-sale.entity.js';
import { RetailPosService } from './retail-pos.service.js';
import { RetailPosController } from './retail-pos.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingRetailSale, Booking, Product]),
    BusinessModule,
  ],
  controllers: [RetailPosController],
  providers: [RetailPosService],
  exports: [RetailPosService],
})
export class RetailPosModule {}
