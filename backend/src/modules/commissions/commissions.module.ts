import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRule } from './entities/commission-rule.entity.js';
import { CommissionsService } from './commissions.service.js';
import { CommissionsController } from './commissions.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionRule]), BusinessModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
