import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity.js';
import { PatientClinicalProfilesService } from '../patient-clinical-profiles/patient-clinical-profiles.service.js';
import { PatientClinicalProfileAccessService } from '../patient-clinical-profiles/shared/patient-clinical-profile-access.service.js';
import { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import { PatientEncountersService } from '../patient-clinical-profiles/patient-encounters.service.js';
import { PatientStaffNotesService } from '../patient-clinical-profiles/patient-staff-notes.service.js';
import { PatientStaffNoteAccessService } from '../patient-clinical-profiles/shared/patient-staff-note-access.service.js';
import { PatientClinicalAlertsService } from '../patient-clinical-profiles/patient-clinical-alerts.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleAddCustomerStaffNoteLogic,
  handleCreateEncounterAddendumLogic,
  handleDismissPatientAlertLogic,
  handleListCustomerStaffNotesLogic,
  handleReleasePatientDocumentLogic,
  handleUpdateClinicalProfileLogic,
  handleUpdateEncounterByBookingLogic,
  type PatientClinicalMutationsLogicDeps,
} from './ai-patient-clinical-mutations.logic.js';

@Injectable()
export class AiPatientClinicalMutationsService {
  private readonly deps: PatientClinicalMutationsLogicDeps;

  constructor(
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    profilesService: PatientClinicalProfilesService,
    profileAccessService: PatientClinicalProfileAccessService,
    documentsService: PatientDocumentsService,
    encountersService: PatientEncountersService,
    staffNotesService: PatientStaffNotesService,
    staffNoteAccessService: PatientStaffNoteAccessService,
    alertsService: PatientClinicalAlertsService,
  ) {
    this.deps = {
      customerRepo,
      profilesService,
      profileAccessService,
      documentsService,
      encountersService,
      staffNotesService,
      staffNoteAccessService,
      alertsService,
    };
  }

  handleUpdateClinicalProfile(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateClinicalProfileLogic(this.deps, businessId, userId, params);
  }

  handleDismissPatientAlert(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleDismissPatientAlertLogic(this.deps, businessId, userId, params);
  }

  handleReleasePatientDocument(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleReleasePatientDocumentLogic(this.deps, businessId, userId, params);
  }

  handleCreateEncounterAddendum(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateEncounterAddendumLogic(this.deps, businessId, userId, params);
  }

  handleUpdateEncounterByBooking(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateEncounterByBookingLogic(this.deps, businessId, userId, params);
  }

  handleListCustomerStaffNotes(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleListCustomerStaffNotesLogic(this.deps, businessId, userId, params);
  }

  handleAddCustomerStaffNote(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleAddCustomerStaffNoteLogic(this.deps, businessId, userId, params);
  }
}
