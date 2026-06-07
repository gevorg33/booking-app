import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { ClinicQuestionnairesModule } from '../clinic-questionnaires/clinic-questionnaires.module.js';
import { PatientClinicalProfilesModule } from '../patient-clinical-profiles/patient-clinical-profiles.module.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { ClinicPreVisitIntake } from './entities/clinic-pre-visit-intake.entity.js';
import { ClinicPreVisitIntakesController } from './clinic-pre-visit-intakes.controller.js';
import { ClinicPreVisitIntakeService } from './clinic-pre-visit-intake.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClinicPreVisitIntake, Booking]),
    BusinessModule,
    ClinicQuestionnairesModule,
    PatientClinicalProfilesModule,
  ],
  controllers: [ClinicPreVisitIntakesController],
  providers: [ClinicPreVisitIntakeService],
  exports: [ClinicPreVisitIntakeService],
})
export class ClinicPreVisitIntakesModule {}
