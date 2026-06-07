import { Injectable } from '@nestjs/common';
import {
  decryptPatientClinicalProfilePhi,
  encryptPatientClinicalProfilePhi,
  listPatientClinicalProfilePhiFieldsRead,
  listPatientClinicalProfilePhiFieldsTouched,
  maskPatientClinicalProfilePhiFields,
  canAccessPatientClinicalProfilePhi,
  type PatientClinicalProfilePhiCarrier,
} from '../../../common/utils/patient-clinical-profile-phi.util.js';
import type { CustomerClinicalPhiAccessContext } from '../../../common/utils/clinic-chart-access.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class PatientClinicalProfilePhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptProfileForStorage<
    T extends PatientClinicalProfilePhiCarrier & {
      id: string;
      businessId: string;
    },
  >(business: Business, profile: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return profile;
    return encryptPatientClinicalProfilePhi(profile, businessKey);
  }

  async decryptProfileForStaff<
    T extends PatientClinicalProfilePhiCarrier & {
      id: string;
      businessId: string;
    },
  >(
    business: Business,
    profile: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return profile;
    if (
      !canAccessPatientClinicalProfilePhi(
        staff.role,
        access,
        staff.employeeId ?? null,
      )
    ) {
      return maskPatientClinicalProfilePhiFields(profile);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return profile;
    const decrypted = decryptPatientClinicalProfilePhi(profile, businessKey);
    const fields = listPatientClinicalProfilePhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'patient_clinical_profile',
        profile.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditProfilePhiWrite(
    business: Business,
    profile: PatientClinicalProfilePhiCarrier & {
      id: string;
      businessId: string;
    },
    before: PatientClinicalProfilePhiCarrier | null | undefined,
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const touched = listPatientClinicalProfilePhiFieldsTouched(
      before ?? null,
      profile,
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
      'patient_clinical_profile',
      profile.id,
      touched,
    );
  }
}
