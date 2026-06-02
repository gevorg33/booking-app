import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { OpenAiModule } from '../integrations/openai/openai.module.js';
import { PlanEntitlementsService } from './plan-entitlements.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Employee]), OpenAiModule],
  providers: [PlanEntitlementsService],
  exports: [PlanEntitlementsService],
})
export class PlanEntitlementsModule {}
