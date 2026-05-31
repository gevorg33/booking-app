import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { StrategyEvalService } from './strategy-eval.service.js';
import { StrategyEvalController } from './strategy-eval.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), BusinessModule],
  controllers: [StrategyEvalController],
  providers: [StrategyEvalService],
  exports: [StrategyEvalService],
})
export class StrategyEvalModule {}
