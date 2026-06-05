import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CategoryRecommendedProduct,
  Product,
  ServiceProduct,
  ServiceRecommendedProduct,
} from './entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import { InventoryService } from './inventory.service.js';
import { ProductRecommendationService } from './product-recommendation.service.js';
import { InventoryController } from './inventory.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ServiceProduct,
      ServiceRecommendedProduct,
      CategoryRecommendedProduct,
      Service,
      ServiceCategory,
    ]),
    BusinessModule,
    EventStoreModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, ProductRecommendationService],
  exports: [InventoryService, ProductRecommendationService],
})
export class InventoryModule {}
