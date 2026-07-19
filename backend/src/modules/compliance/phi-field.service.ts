import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  decryptBookingPhi,
  encryptBookingPhi,
  generateBusinessPhiEncryptionKeyMaterial,
  deriveBusinessPhiEncryptionKey,
  listPhiFieldsRead,
  listPhiFieldsTouched,
  type BookingPhiCarrier,
  type PhiEncryptionKeyMaterial,
} from '../../common/utils/phi-encryption.util.js';
import {
  canAccessBookingPhi,
  maskBookingPhiFields,
} from '../../common/utils/phi-minimum-access.util.js';
import {
  isHipaaModeActive,
  readBusinessHipaaSettings,
} from '../../common/utils/business-compliance.util.js';
import { Business } from '../business/entities/business.entity.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  PhiAccessAuditService,
  type PhiAccessAuditContext,
} from './phi-access-audit.service.js';

export interface PhiStaffContext {
  userId: string;
  role: MemberRole | string;
  employeeId?: string | null;
  ip?: string | null;
}

@Injectable()
export class PhiFieldService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly phiAccessAudit: PhiAccessAuditService,
  ) {}

  private masterKey(): string {
    return (
      this.config.get<string>('PHI_ENCRYPTION_MASTER_KEY') ||
      this.config.get<string>('INTEGRATIONS_ENCRYPTION_KEY') ||
      this.config.get<string>('JWT_SECRET') ||
      'dev-phi-encryption-key'
    );
  }

  isHipaaActiveForBusiness(business: Pick<Business, 'settings'>): boolean {
    const businessType = business.settings?.businessType as string | undefined;
    return isHipaaModeActive(business.settings, businessType);
  }

  private readKeyMaterial(
    settings: Record<string, unknown>,
  ): PhiEncryptionKeyMaterial | null {
    const hipaa = readBusinessHipaaSettings(settings);
    if (
      typeof hipaa.phiEncryptionKeyEnc === 'string' &&
      typeof hipaa.phiEncryptionKeyId === 'string'
    ) {
      return {
        keyEnc: hipaa.phiEncryptionKeyEnc,
        keyId: hipaa.phiEncryptionKeyId,
      };
    }
    return null;
  }

  async ensureBusinessPhiKey(
    business: Business,
  ): Promise<PhiEncryptionKeyMaterial> {
    const existing = this.readKeyMaterial(business.settings ?? {});
    if (existing) return existing;
    const material = generateBusinessPhiEncryptionKeyMaterial(this.masterKey());
    const hipaa = readBusinessHipaaSettings(business.settings);
    business.settings = {
      ...(business.settings ?? {}),
      hipaa: {
        ...hipaa,
        phiEncryptionKeyId: material.keyId,
        phiEncryptionKeyEnc: material.keyEnc,
      },
    };
    await this.businessRepo.save(business);
    return material;
  }

  private resolveBusinessKey(
    businessId: string,
    settings: Record<string, unknown>,
  ): string | null {
    const material = this.readKeyMaterial(settings);
    if (!material) return null;
    return deriveBusinessPhiEncryptionKey(
      businessId,
      material,
      this.masterKey(),
    );
  }

  async resolveBusinessEncryptionKey(
    business: Business,
  ): Promise<string | null> {
    if (!this.isHipaaActiveForBusiness(business)) return null;
    const material = await this.ensureBusinessPhiKey(business);
    return deriveBusinessPhiEncryptionKey(
      business.id,
      material,
      this.masterKey(),
    );
  }

  async encryptBookingForStorage<T extends BookingPhiCarrier>(
    business: Business,
    booking: T,
  ): Promise<T> {
    if (!this.isHipaaActiveForBusiness(business)) return booking;
    const material = await this.ensureBusinessPhiKey(business);
    const businessKey = deriveBusinessPhiEncryptionKey(
      business.id,
      material,
      this.masterKey(),
    );
    return encryptBookingPhi(booking, businessKey);
  }

  async auditBookingPhiWrite(
    business: Business,
    booking: BookingPhiCarrier & { id: string; businessId: string },
    before: BookingPhiCarrier | null | undefined,
    audit:
      | PhiStaffContext
      | {
          role: 'public' | 'system' | 'customer';
          userId?: null;
          ip?: string | null;
        },
  ): Promise<void> {
    if (!this.isHipaaActiveForBusiness(business)) return;
    const touched = listPhiFieldsTouched(before ?? null, booking);
    if (touched.length === 0) return;
    const context: PhiAccessAuditContext = {
      businessId: booking.businessId,
      userId: audit && 'userId' in audit ? (audit.userId ?? null) : null,
      role: audit && 'role' in audit ? String(audit.role) : MemberRole.STAFF,
      ip: audit?.ip ?? null,
    };
    await this.phiAccessAudit.logBatch(
      context,
      'write',
      'booking',
      booking.id,
      touched,
    );
  }

  async decryptBookingForStaff<
    T extends BookingPhiCarrier & {
      id: string;
      businessId: string;
      employeeId: string;
      linkedEmployeeIds?: string[] | null;
    },
  >(business: Business, booking: T, staff: PhiStaffContext): Promise<T> {
    if (!this.isHipaaActiveForBusiness(business)) return booking;
    if (!canAccessBookingPhi(staff.role, booking, staff.employeeId ?? null)) {
      return maskBookingPhiFields(booking);
    }
    const businessKey = this.resolveBusinessKey(
      business.id,
      business.settings ?? {},
    );
    if (!businessKey) return booking;
    const decrypted = decryptBookingPhi(booking, businessKey);
    const fields = listPhiFieldsRead(decrypted);
    if (fields.length > 0) {
      await this.phiAccessAudit.logBatch(
        {
          businessId: business.id,
          userId: staff.userId,
          role: String(staff.role),
          ip: staff.ip ?? null,
        },
        'read',
        'booking',
        booking.id,
        fields,
      );
    }
    return decrypted;
  }

  async decryptBookingsForStaff<
    T extends BookingPhiCarrier & {
      id: string;
      businessId: string;
      employeeId: string;
      linkedEmployeeIds?: string[] | null;
    },
  >(business: Business, bookings: T[], staff: PhiStaffContext): Promise<T[]> {
    return Promise.all(
      bookings.map((booking) =>
        this.decryptBookingForStaff(business, booking, staff),
      ),
    );
  }
}
