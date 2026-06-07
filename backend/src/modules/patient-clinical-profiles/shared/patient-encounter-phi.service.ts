import { Injectable } from '@nestjs/common';
import {
  decryptPatientEncounterAddendumPhi,
  decryptPatientEncounterPhi,
  encryptPatientEncounterAddendumPhi,
  encryptPatientEncounterPhi,
  listPatientEncounterAddendumPhiFieldsRead,
  listPatientEncounterPhiFieldsRead,
  listPatientEncounterPhiFieldsTouched,
  maskPatientEncounterAddendumPhiFields,
  maskPatientEncounterPhiFields,
  canAccessPatientEncounterPhi,
  type PatientEncounterAddendumPhiCarrier,
  type PatientEncounterPhiCarrier,
} from '../../../common/utils/patient-encounter-phi.util.js';
import type { CustomerClinicalPhiAccessContext } from '../../../common/utils/clinic-chart-access.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class PatientEncounterPhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptEncounterForStorage<
    T extends PatientEncounterPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(business: Business, encounter: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return encounter;
    return encryptPatientEncounterPhi(encounter, businessKey);
  }

  async encryptAddendumForStorage<
    T extends PatientEncounterAddendumPhiCarrier & {
      id: string;
      encounterId: string;
    },
  >(business: Business, addendum: T, encounterBusinessId: string): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return addendum;
    return encryptPatientEncounterAddendumPhi(addendum, businessKey);
  }

  async decryptEncounterForStaff<
    T extends PatientEncounterPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(
    business: Business,
    encounter: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
    auditResourceId: string,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return encounter;
    if (
      !canAccessPatientEncounterPhi(
        staff.role,
        access,
        staff.employeeId ?? null,
      )
    ) {
      return maskPatientEncounterPhiFields(encounter);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return encounter;
    const decrypted = decryptPatientEncounterPhi(encounter, businessKey);
    const fields = listPatientEncounterPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'patient_encounter',
        auditResourceId,
        fields,
      );
    }
    return decrypted;
  }

  async decryptAddendumForStaff<
    T extends PatientEncounterAddendumPhiCarrier & {
      id: string;
      encounterId: string;
    },
  >(
    business: Business,
    addendum: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return addendum;
    if (
      !canAccessPatientEncounterPhi(
        staff.role,
        access,
        staff.employeeId ?? null,
      )
    ) {
      return maskPatientEncounterAddendumPhiFields(addendum);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return addendum;
    const decrypted = decryptPatientEncounterAddendumPhi(addendum, businessKey);
    const fields = listPatientEncounterAddendumPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'patient_encounter_addendum',
        addendum.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditEncounterPhiWrite(
    business: Business,
    encounter: PatientEncounterPhiCarrier & { id: string; businessId: string },
    before: PatientEncounterPhiCarrier | null | undefined,
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const touched = listPatientEncounterPhiFieldsTouched(
      before ?? null,
      encounter,
    );
    if (touched.length === 0) return;
    await this.phiAccessAudit.logBatch(
      {
        businessId: business.id,
        userId: staff.userId,
        role: String(staff.role),
        ip: staff.ip ?? null,
      },
      'write',
      'patient_encounter',
      encounter.id,
      touched,
    );
  }

  async auditAddendumPhiWrite(
    business: Business,
    addendum: PatientEncounterAddendumPhiCarrier & {
      id: string;
      encounterId: string;
    },
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const fields = listPatientEncounterAddendumPhiFieldsRead(addendum);
    if (fields.length === 0) return;
    await this.phiAccessAudit.logBatch(
      {
        businessId: business.id,
        userId: staff.userId,
        role: String(staff.role),
        ip: staff.ip ?? null,
      },
      'write',
      'patient_encounter_addendum',
      addendum.id,
      fields,
    );
  }
}
