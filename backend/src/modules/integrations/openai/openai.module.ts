import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { AiUsageLog } from '../entities/ai-usage-log.entity.js';
import { OpenAiIntegrationService } from './openai-integration.service.js';
import { OpenAiGatewayService } from './openai-gateway.service.js';
import { AiUsageService } from './ai-usage.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business, AiUsageLog])],
  providers: [OpenAiIntegrationService, OpenAiGatewayService, AiUsageService],
  exports: [OpenAiIntegrationService, OpenAiGatewayService, AiUsageService],
})
export class OpenAiModule {}
