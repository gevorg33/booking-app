import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { ClinicTestResultsModule } from '../clinic-test-results/clinic-test-results.module.js';
import { ComplianceModule } from '../compliance/compliance.module.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PatientClinicalProfile } from './entities/patient-clinical-profile.entity.js';
import { PatientEncounter } from './entities/patient-encounter.entity.js';
import { PatientEncounterAddendum } from './entities/patient-encounter-addendum.entity.js';
import { PatientStaffNote } from './entities/patient-staff-note.entity.js';
import { PatientChartDocument } from './entities/patient-chart-document.entity.js';
import { PatientChartController } from './patient-chart.controller.js';
import { PatientChartService } from './patient-chart.service.js';
import { PatientEncountersController } from './patient-encounters.controller.js';
import { PatientEncountersService } from './patient-encounters.service.js';
import { PatientStaffNotesController } from './patient-staff-notes.controller.js';
import { PatientStaffNotesService } from './patient-staff-notes.service.js';
import { PatientDocumentsController } from './patient-documents.controller.js';
import { PatientDocumentsService } from './patient-documents.service.js';
import { PatientClinicalProfilesController } from './patient-clinical-profiles.controller.js';
import { PatientClinicalProfilesService } from './patient-clinical-profiles.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfilePhiService } from './shared/patient-clinical-profile-phi.service.js';
import { PatientEncounterPhiService } from './shared/patient-encounter-phi.service.js';
import { PatientStaffNoteAccessService } from './shared/patient-staff-note-access.service.js';
import { PatientStaffNotePhiService } from './shared/patient-staff-note-phi.service.js';
import { PatientDocumentPhiService } from './shared/patient-document-phi.service.js';
import { UploadModule } from '../upload/upload.module.js';
import { ExternalDoctorsModule } from '../external-doctors/external-doctors.module.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ClinicPreVisitIntake } from '../clinic-pre-visit-intakes/entities/clinic-pre-visit-intake.entity.js';
import { ClinicPatientAlertDismissal } from './entities/clinic-patient-alert-dismissal.entity.js';
import { PatientClinicalAlertsService } from './patient-clinical-alerts.service.js';
import { ClinicAfterVisitSummary } from './entities/clinic-after-visit-summary.entity.js';
import { ClinicAfterVisitSummariesController } from './clinic-after-visit-summaries.controller.js';
import { ClinicAfterVisitSummariesService } from './clinic-after-visit-summaries.service.js';
import { ClinicAfterVisitSummaryPhiService } from './shared/clinic-after-visit-summary-phi.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PatientClinicalProfile,
      PatientEncounter,
      PatientEncounterAddendum,
      PatientStaffNote,
      PatientChartDocument,
      Customer,
      Employee,
      Booking,
      ClinicTestOrder,
      ClinicTestResult,
      ClinicPreVisitIntake,
      Service,
      ClinicPatientAlertDismissal,
      ClinicAfterVisitSummary,
    ]),
    BusinessModule,
    ComplianceModule,
    ClinicTestResultsModule,
    UploadModule,
    ExternalDoctorsModule,
  ],
  controllers: [
    PatientClinicalProfilesController,
    PatientChartController,
    PatientEncountersController,
    PatientStaffNotesController,
    PatientDocumentsController,
    ClinicAfterVisitSummariesController,
  ],
  providers: [
    PatientClinicalProfilesService,
    PatientClinicalProfileAccessService,
    PatientClinicalProfilePhiService,
    PatientChartService,
    PatientClinicalAlertsService,
    PatientEncountersService,
    PatientEncounterPhiService,
    PatientStaffNotesService,
    PatientStaffNoteAccessService,
    PatientStaffNotePhiService,
    PatientDocumentsService,
    PatientDocumentPhiService,
    ClinicAfterVisitSummariesService,
    ClinicAfterVisitSummaryPhiService,
  ],
  exports: [
    PatientClinicalProfilesService,
    PatientClinicalProfileAccessService,
    PatientClinicalProfilePhiService,
    PatientChartService,
    PatientClinicalAlertsService,
    PatientEncountersService,
    PatientEncounterPhiService,
    PatientStaffNotesService,
    PatientStaffNoteAccessService,
    PatientStaffNotePhiService,
    PatientDocumentsService,
    PatientDocumentPhiService,
    ClinicAfterVisitSummariesService,
    ClinicAfterVisitSummaryPhiService,
  ],
})
export class PatientClinicalProfilesModule {}
