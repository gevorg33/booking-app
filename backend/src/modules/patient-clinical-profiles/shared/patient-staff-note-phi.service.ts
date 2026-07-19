import { Injectable } from '@nestjs/common';
import {
  decryptPatientStaffNotePhi,
  encryptPatientStaffNotePhi,
  listPatientStaffNotePhiFieldsRead,
  maskPatientStaffNotePhiFields,
  canAccessPatientStaffNotePhi,
  type PatientStaffNotePhiCarrier,
} from '../../../common/utils/patient-staff-note-phi.util.js';
import type { CustomerClinicalPhiAccessContext } from '../../../common/utils/clinic-chart-access.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class PatientStaffNotePhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptNoteForStorage<
    T extends PatientStaffNotePhiCarrier & {
      businessId: string;
      id?: string;
    },
  >(business: Business, note: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return note;
    return encryptPatientStaffNotePhi(note, businessKey);
  }

  async decryptNoteForStaff<
    T extends PatientStaffNotePhiCarrier & { id: string; businessId: string },
  >(
    business: Business,
    note: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return note;
    if (
      !canAccessPatientStaffNotePhi(
        staff.role,
        access,
        staff.employeeId ?? null,
      )
    ) {
      return maskPatientStaffNotePhiFields(note);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return note;
    const decrypted = decryptPatientStaffNotePhi(note, businessKey);
    const fields = listPatientStaffNotePhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'patient_staff_note',
        note.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditNotePhiWrite(
    business: Business,
    note: PatientStaffNotePhiCarrier & { id: string; businessId: string },
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const fields = listPatientStaffNotePhiFieldsRead(note);
    if (fields.length === 0) return;
    await this.phiAccessAudit.logBatch(
      {
        businessId: business.id,
        userId: staff.userId,
        role: String(staff.role),
        ip: staff.ip ?? null,
      },
      'write',
      'patient_staff_note',
      note.id,
      fields,
    );
  }
}
