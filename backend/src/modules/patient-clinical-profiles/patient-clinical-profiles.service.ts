import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { PatientClinicalProfile } from './entities/patient-clinical-profile.entity.js';
import type { UpdatePatientClinicalProfileDto } from './dto/update-patient-clinical-profile.dto.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfilePhiService } from './shared/patient-clinical-profile-phi.service.js';
import type { PatientClinicalProfileAccessContext } from './shared/patient-clinical-profile-access.service.js';
import { ExternalDoctorsService } from '../external-doctors/external-doctors.service.js';

export interface PatientReferringExternalDoctorView {
  id: string;
  name: string;
  clinicName: string | null;
  address: string;
  fax: string | null;
}

export interface PatientClinicalProfileView {
  id: string;
  businessId: string;
  customerId: string;
  allergies: string | null;
  chronicProblems: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  bloodType: string | null;
  referringExternalDoctorId: string | null;
  referringExternalDoctor: PatientReferringExternalDoctorView | null;
  phiMasked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PatientClinicalProfilesService {
  constructor(
    @InjectRepository(PatientClinicalProfile)
    private readonly profileRepo: Repository<PatientClinicalProfile>,
    private readonly businessService: BusinessService,
    private readonly accessService: PatientClinicalProfileAccessService,
    private readonly phiService: PatientClinicalProfilePhiService,
    private readonly externalDoctorsService: ExternalDoctorsService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private emptyProfileView(
    businessId: string,
    customerId: string,
  ): PatientClinicalProfileView {
    return {
      id: '',
      businessId,
      customerId,
      allergies: null,
      chronicProblems: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelationship: null,
      bloodType: null,
      referringExternalDoctorId: null,
      referringExternalDoctor: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  }

  private profileHasPhiContent(
    profile: PatientClinicalProfilePhiCarrier,
  ): boolean {
    return !!(
      profile.allergies?.trim() ||
      profile.chronicProblems?.trim() ||
      profile.emergencyContactName?.trim() ||
      profile.emergencyContactPhone?.trim() ||
      profile.emergencyContactRelationship?.trim() ||
      profile.bloodType?.trim()
    );
  }

  private async mapProfileView(
    profile: PatientClinicalProfile,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientClinicalProfileView> {
    const business = await this.businessService.findOne(profile.businessId);
    const staff = this.accessService.toPhiStaffContext(access.ctx);
    const decrypted = await this.phiService.decryptProfileForStaff(
      business,
      profile,
      staff,
      access.phiAccess,
    );
    const hadPhi = this.profileHasPhiContent(profile);
    const phiMasked =
      hadPhi &&
      !this.profileHasPhiContent({
        allergies: decrypted.allergies,
        chronicProblems: decrypted.chronicProblems,
        emergencyContactName: decrypted.emergencyContactName,
        emergencyContactPhone: decrypted.emergencyContactPhone,
        emergencyContactRelationship: decrypted.emergencyContactRelationship,
        bloodType: decrypted.bloodType,
      });

    const referringExternalDoctor = profile.referringExternalDoctorId
      ? await this.externalDoctorsService.resolveActiveReferringDoctor(
          profile.businessId,
          profile.referringExternalDoctorId,
        )
      : null;

    return {
      id: profile.id,
      businessId: profile.businessId,
      customerId: profile.customerId,
      allergies: decrypted.allergies ?? null,
      chronicProblems: decrypted.chronicProblems ?? null,
      emergencyContactName: decrypted.emergencyContactName ?? null,
      emergencyContactPhone: decrypted.emergencyContactPhone ?? null,
      emergencyContactRelationship:
        decrypted.emergencyContactRelationship ?? null,
      bloodType: decrypted.bloodType ?? null,
      referringExternalDoctorId: profile.referringExternalDoctorId ?? null,
      referringExternalDoctor,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      ...(phiMasked ? { phiMasked: true } : {}),
    };
  }

  async getProfileForCustomer(
    businessId: string,
    customerId: string,
    access: PatientClinicalProfileAccessContext,
  ): Promise<PatientClinicalProfileView> {
    await this.assertEnabled(businessId);

    const profile = await this.profileRepo.findOne({
      where: { businessId, customerId },
    });
    if (!profile) {
      return this.emptyProfileView(businessId, customerId);
    }

    return this.mapProfileView(profile, access);
  }

  async upsertProfileForCustomer(
    businessId: string,
    customerId: string,
    access: PatientClinicalProfileAccessContext,
    dto: UpdatePatientClinicalProfileDto,
  ): Promise<PatientClinicalProfileView> {
    await this.assertEnabled(businessId);

    if (!access.phiAccess.hasAssignedBooking && access.ctx.employeeId) {
      const role = String(access.ctx.membershipRole).toLowerCase();
      if (!['owner', 'admin', 'manager'].includes(role)) {
        throw new ForbiddenException(
          'You do not have permission to update this patient clinical profile',
        );
      }
    }

    const business = await this.businessService.findOne(businessId);
    let profile = await this.profileRepo.findOne({
      where: { businessId, customerId },
    });
    const beforePhi = profile
      ? {
          allergies: profile.allergies,
          chronicProblems: profile.chronicProblems,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
          emergencyContactRelationship: profile.emergencyContactRelationship,
          bloodType: profile.bloodType,
        }
      : null;

    if (!profile) {
      profile = this.profileRepo.create({ businessId, customerId });
    }

    if (dto.allergies !== undefined) profile.allergies = dto.allergies;
    if (dto.chronicProblems !== undefined) {
      profile.chronicProblems = dto.chronicProblems;
    }
    if (dto.emergencyContactName !== undefined) {
      profile.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.emergencyContactRelationship !== undefined) {
      profile.emergencyContactRelationship = dto.emergencyContactRelationship;
    }
    if (dto.bloodType !== undefined) profile.bloodType = dto.bloodType;
    if (dto.referringExternalDoctorId !== undefined) {
      if (dto.referringExternalDoctorId) {
        await this.externalDoctorsService.resolveActiveReferringDoctor(
          businessId,
          dto.referringExternalDoctorId,
        );
        profile.referringExternalDoctorId = dto.referringExternalDoctorId;
      } else {
        profile.referringExternalDoctorId = null;
      }
    }

    const encrypted = await this.phiService.encryptProfileForStorage(
      business,
      profile,
    );
    Object.assign(profile, encrypted);
    profile = await this.profileRepo.save(profile);

    await this.phiService.auditProfilePhiWrite(
      business,
      profile,
      beforePhi,
      this.accessService.toPhiStaffContext(access.ctx),
    );

    return this.mapProfileView(profile, access);
  }
}

type PatientClinicalProfilePhiCarrier = Pick<
  PatientClinicalProfile,
  | 'allergies'
  | 'chronicProblems'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelationship'
  | 'bloodType'
>;
