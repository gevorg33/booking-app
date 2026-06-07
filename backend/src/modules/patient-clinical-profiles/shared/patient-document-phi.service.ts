import { Injectable } from '@nestjs/common';
import {
  decryptPatientDocumentPhi,
  encryptPatientDocumentPhi,
  listPatientDocumentPhiFieldsRead,
  maskPatientDocumentPhiFields,
  canAccessPatientDocumentPhi,
  type PatientDocumentPhiCarrier,
} from '../../../common/utils/patient-document-phi.util.js';
import type { CustomerClinicalPhiAccessContext } from '../../../common/utils/clinic-chart-access.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class PatientDocumentPhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptDocumentForStorage<
    T extends PatientDocumentPhiCarrier & { id: string; businessId: string },
  >(business: Business, document: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return document;
    return encryptPatientDocumentPhi(document, businessKey);
  }

  async decryptDocumentForStaff<
    T extends PatientDocumentPhiCarrier & { id: string; businessId: string },
  >(
    business: Business,
    document: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return document;
    if (
      !canAccessPatientDocumentPhi(staff.role, access, staff.employeeId ?? null)
    ) {
      return maskPatientDocumentPhiFields(document);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return document;
    const decrypted = decryptPatientDocumentPhi(document, businessKey);
    const fields = listPatientDocumentPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'patient_chart_document',
        document.id,
        fields,
      );
    }
    return decrypted;
  }

  async decryptDocumentForCustomer<
    T extends PatientDocumentPhiCarrier & { id: string; businessId: string },
  >(business: Business, document: T, customerUserId: string): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return document;
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return document;
    const decrypted = decryptPatientDocumentPhi(document, businessKey);
    const fields = listPatientDocumentPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: customerUserId,
          role: 'customer',
          ip: null,
        },
        'read',
        'patient_chart_document',
        document.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditDocumentPhiWrite(
    business: Business,
    document: PatientDocumentPhiCarrier & { id: string; businessId: string },
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const fields = listPatientDocumentPhiFieldsRead(document);
    if (fields.length === 0) return;
    await this.phiAccessAudit.logBatch(
      {
        businessId: business.id,
        userId: staff.userId,
        role: String(staff.role),
        ip: staff.ip ?? null,
      },
      'write',
      'patient_chart_document',
      document.id,
      fields,
    );
  }
}
