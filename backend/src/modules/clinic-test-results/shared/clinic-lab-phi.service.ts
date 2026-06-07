import { Injectable } from '@nestjs/common';
import {
  canAccessClinicLabPhi,
  decryptClinicStatusHistoryNote,
  decryptClinicTestOrderPhi,
  decryptClinicTestResultMeasurementPhi,
  decryptClinicTestResultPhi,
  encryptClinicStatusHistoryNote,
  encryptClinicTestOrderPhi,
  encryptClinicTestResultMeasurementPhi,
  encryptClinicTestResultPhi,
  listClinicMeasurementPhiFieldsRead,
  listClinicMeasurementPhiFieldsTouched,
  listClinicTestResultPhiFieldsRead,
  listClinicTestResultPhiFieldsTouched,
  maskClinicTestOrderPhiFields,
  maskClinicTestResultMeasurementPhiFields,
  maskClinicTestResultPhiFields,
  type ClinicTestOrderPhiCarrier,
  type ClinicTestResultMeasurementPhiCarrier,
  type ClinicTestResultPhiCarrier,
} from '../../../common/utils/clinic-lab-phi.util.js';
import type { BookingPhiAccessTarget } from '../../../common/utils/phi-minimum-access.util.js';
import {
  decryptLegacyPatientTestResultRows,
  hasLegacyPatientTestResultNotes,
  maskLegacyPatientTestResultRows,
  parseLegacyPatientTestResultRows,
  type LegacyBookingPatientTestResultRow,
} from '../../../common/utils/legacy-booking-patient-test-results-phi.util.js';
import type { Business } from '../../business/entities/business.entity.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import {
  PhiFieldService,
  type PhiStaffContext,
} from '../../compliance/phi-field.service.js';

@Injectable()
export class ClinicLabPhiService {
  constructor(
    private readonly phiFieldService: PhiFieldService,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  async encryptTestResultForStorage<
    T extends ClinicTestResultPhiCarrier & { id: string; businessId: string },
  >(business: Business, result: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return result;
    return encryptClinicTestResultPhi(result, businessKey);
  }

  async encryptTestOrderForStorage<
    T extends ClinicTestOrderPhiCarrier & { id: string; businessId: string },
  >(business: Business, order: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return order;
    return encryptClinicTestOrderPhi(order, businessKey);
  }

  async encryptMeasurementForStorage<
    T extends ClinicTestResultMeasurementPhiCarrier & { id: string },
  >(business: Business, measurement: T): Promise<T> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return measurement;
    return encryptClinicTestResultMeasurementPhi(measurement, businessKey);
  }

  async encryptStatusHistoryNoteForStorage(
    business: Business,
    note: string | null | undefined,
  ): Promise<string | null | undefined> {
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return note;
    return encryptClinicStatusHistoryNote(note, businessKey);
  }

  async decryptTestResultForStaff<
    T extends ClinicTestResultPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(
    business: Business,
    result: T,
    staff: PhiStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return result;
    if (
      !canAccessClinicLabPhi(
        staff.role,
        bookingAccess,
        staff.employeeId ?? null,
      )
    ) {
      return maskClinicTestResultPhiFields(result);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return result;
    const decrypted = decryptClinicTestResultPhi(result, businessKey);
    const fields = listClinicTestResultPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'clinic_test_result',
        result.id,
        fields,
      );
    }
    return decrypted;
  }

  async decryptTestOrderForStaff<
    T extends ClinicTestOrderPhiCarrier & {
      id: string;
      businessId: string;
    },
  >(
    business: Business,
    order: T,
    staff: PhiStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return order;
    if (
      !canAccessClinicLabPhi(
        staff.role,
        bookingAccess,
        staff.employeeId ?? null,
      )
    ) {
      return maskClinicTestOrderPhiFields(order);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return order;
    return decryptClinicTestOrderPhi(order, businessKey);
  }

  async decryptMeasurementForStaff<
    T extends ClinicTestResultMeasurementPhiCarrier & { id: string },
  >(
    business: Business,
    measurement: T,
    staff: PhiStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<T> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) {
      return measurement;
    }
    if (
      !canAccessClinicLabPhi(
        staff.role,
        bookingAccess,
        staff.employeeId ?? null,
      )
    ) {
      return maskClinicTestResultMeasurementPhiFields(measurement);
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return measurement;
    const decrypted = decryptClinicTestResultMeasurementPhi(
      measurement,
      businessKey,
    );
    const fields = listClinicMeasurementPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'clinic_test_result_measurement',
        measurement.id,
        fields,
      );
    }
    return decrypted;
  }

  async auditMeasurementPhiWrite(
    business: Business,
    measurement: ClinicTestResultMeasurementPhiCarrier & { id: string },
    before: ClinicTestResultMeasurementPhiCarrier | null | undefined,
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const touched = listClinicMeasurementPhiFieldsTouched(
      before ?? null,
      measurement,
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
      'clinic_test_result_measurement',
      measurement.id,
      touched,
    );
  }

  async decryptStatusHistoryNoteForStaff(
    business: Business,
    note: string | null | undefined,
    staff: PhiStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<string | null | undefined> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return note;
    if (
      !canAccessClinicLabPhi(
        staff.role,
        bookingAccess,
        staff.employeeId ?? null,
      )
    ) {
      return note ? null : note;
    }
    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) return note;
    return decryptClinicStatusHistoryNote(note, businessKey);
  }

  async auditTestResultPhiWrite(
    business: Business,
    result: ClinicTestResultPhiCarrier & { id: string; businessId: string },
    before: ClinicTestResultPhiCarrier | null | undefined,
    staff: PhiStaffContext,
  ): Promise<void> {
    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) return;
    const touched = listClinicTestResultPhiFieldsTouched(
      before ?? null,
      result,
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
      'clinic_test_result',
      result.id,
      touched,
    );
  }

  /** Backward-compat read path for booking.metadata.patient_test_results (legacy v1). */
  async decryptLegacyPatientTestResultsForStaff(
    business: Business,
    bookingId: string,
    metadata: Record<string, unknown> | null | undefined,
    staff: PhiStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<{
    rows: LegacyBookingPatientTestResultRow[];
    phiMasked: boolean;
  }> {
    const parsed = parseLegacyPatientTestResultRows(metadata);
    if (parsed.length === 0) {
      return { rows: [], phiMasked: false };
    }

    const hadNotes = hasLegacyPatientTestResultNotes(metadata);

    if (!this.phiFieldService.isHipaaActiveForBusiness(business)) {
      return { rows: parsed, phiMasked: false };
    }

    if (
      !canAccessClinicLabPhi(
        staff.role,
        bookingAccess,
        staff.employeeId ?? null,
      )
    ) {
      return {
        rows: maskLegacyPatientTestResultRows(
          parsed,
        ) as LegacyBookingPatientTestResultRow[],
        phiMasked: hadNotes,
      };
    }

    const businessKey =
      await this.phiFieldService.resolveBusinessEncryptionKey(business);
    if (!businessKey) {
      return { rows: parsed, phiMasked: false };
    }

    const decrypted = decryptLegacyPatientTestResultRows(
      parsed,
      businessKey,
    ) as LegacyBookingPatientTestResultRow[];

    if (hadNotes) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'booking',
        bookingId,
        ['patient_test_results'],
      );
    }

    return { rows: decrypted, phiMasked: false };
  }
}
