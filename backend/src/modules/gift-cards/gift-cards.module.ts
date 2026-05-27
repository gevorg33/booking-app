import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardsController } from './gift-cards.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard]), BusinessModule],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
