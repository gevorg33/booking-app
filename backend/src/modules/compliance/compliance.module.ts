import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { ComplianceController } from './compliance.controller.js';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { PhiFieldService } from './phi-field.service.js';
import { DataBreachIncident } from './entities/data-breach-incident.entity.js';
import { PhiAccessAuditLog } from './entities/phi-access-audit-log.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataBreachIncident, PhiAccessAuditLog, Business]),
    BusinessModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceBreachService, PhiAccessAuditService, PhiFieldService],
  exports: [PhiFieldService, PhiAccessAuditService, ComplianceBreachService],
})
export class ComplianceModule {}
