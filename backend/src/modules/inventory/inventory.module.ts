import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ServiceProduct } from './entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ServiceProduct, Service]),
    BusinessModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
