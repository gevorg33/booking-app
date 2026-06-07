import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicDiagnosticCodesController } from './clinic-diagnostic-codes.controller.js';
import { ClinicDiagnosticCodesService } from './clinic-diagnostic-codes.service.js';
import { ClinicDiagnosticCode } from './entities/clinic-diagnostic-code.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClinicDiagnosticCode, Employee, Business]),
    BusinessModule,
  ],
  controllers: [ClinicDiagnosticCodesController],
  providers: [ClinicDiagnosticCodesService],
  exports: [ClinicDiagnosticCodesService],
})
export class ClinicDiagnosticCodesModule {}
