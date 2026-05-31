import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../business/entities/business.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { EnterpriseTrustService } from './enterprise-trust.service.js';
import { EnterpriseTrustController } from './enterprise-trust.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), BusinessModule],
  controllers: [EnterpriseTrustController],
  providers: [EnterpriseTrustService],
  exports: [EnterpriseTrustService],
})
export class EnterpriseTrustModule {}
