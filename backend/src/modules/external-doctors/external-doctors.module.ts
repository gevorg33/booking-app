import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ExternalDoctor } from './entities/external-doctor.entity.js';
import { ExternalDoctorsController } from './external-doctors.controller.js';
import { ExternalDoctorsService } from './external-doctors.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalDoctor, Employee]),
    BusinessModule,
  ],
  controllers: [ExternalDoctorsController],
  providers: [ExternalDoctorsService],
  exports: [ExternalDoctorsService],
})
export class ExternalDoctorsModule {}
