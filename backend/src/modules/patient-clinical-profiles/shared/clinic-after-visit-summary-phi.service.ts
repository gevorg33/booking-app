import { Injectable } from '@nestjs/common';
import {
  canAccessClinicAfterVisitSummaryPhi,
  decryptClinicAfterVisitSummaryPhi,
  encryptClinicAfterVisitSummaryPhi,
  listClinicAfterVisitSummaryPhiFieldsRead,
  listClinicAfterVisitSummaryPhiFieldsTouched,
  maskClinicAfterVisitSummaryPhiFields,
  type ClinicAfterVisitSummaryPhiCarrier,
} from '../../../common/utils/clinic-after-visit-summary-phi.util.js';
import type { CustomerClinicalPhiAccessContext } from '../../../common/utils/clinic-chart-access.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class ClinicAfterVisitSummaryPhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptSummaryForStorage<
    T extends ClinicAfterVisitSummaryPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(business: Business, summary: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return summary;
    return encryptClinicAfterVisitSummaryPhi(summary, businessKey);
  }

  async decryptSummaryForStaff<
    T extends ClinicAfterVisitSummaryPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(
    business: Business,
    summary: T,
    staff: PhiStaffContext,
    access: CustomerClinicalPhiAccessContext,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business))
      return summary;
    if (
      !canAccessClinicAfterVisitSummaryPhi(
        staff.role,
        access,
        staff.employeeId ?? null,
      )
    ) {
      return maskClinicAfterVisitSummaryPhiFields(summary);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return summary;
    const decrypted = decryptClinicAfterVisitSummaryPhi(summary, businessKey);
    const fields = listClinicAfterVisitSummaryPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'clinic_after_visit_summary',
        summary.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditSummaryPhiWrite(
    business: Business,
    summary: ClinicAfterVisitSummaryPhiCarrier & {
      id: string;
      businessId: string;
    },
    before: ClinicAfterVisitSummaryPhiCarrier | null | undefined,
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const touched = listClinicAfterVisitSummaryPhiFieldsTouched(
      before ?? null,
      summary,
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
      'clinic_after_visit_summary',
      summary.id,
      touched,
    );
  }
}
