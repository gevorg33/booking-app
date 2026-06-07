import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CLINIC_LAB_INFO_TYPES,
  CLINIC_LAB_LOCATIONS,
} from '../../../common/utils/clinic-lis.types.js';
import {
  CLINIC_LAB_INFO_LOCATION_MAX_LENGTH,
  CLINIC_LAB_INFO_NAME_MAX_LENGTH,
  CLINIC_LAB_INFO_PHONE_MAX_LENGTH,
  CLINIC_LAB_INTEGRATION_VENDOR_CODE_MAX_LENGTH,
} from '../../../common/utils/clinic-lab-info.util.js';
import { CLINIC_LAB_MACHINE_NAME_MAX_LENGTH } from '../../../common/utils/clinic-lab-machine.util.js';

export class CreateClinicLabInfoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_NAME_MAX_LENGTH)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_LOCATION_MAX_LENGTH)
  location: string;

  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_PHONE_MAX_LENGTH)
  phone: string;

  @IsIn(CLINIC_LAB_LOCATIONS)
  labLocation: (typeof CLINIC_LAB_LOCATIONS)[number];

  @IsOptional()
  @IsIn(CLINIC_LAB_INFO_TYPES)
  labType?: (typeof CLINIC_LAB_INFO_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(CLINIC_LAB_INTEGRATION_VENDOR_CODE_MAX_LENGTH)
  integrationVendorCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClinicLabInfoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_LOCATION_MAX_LENGTH)
  location?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_INFO_PHONE_MAX_LENGTH)
  phone?: string;

  @IsOptional()
  @IsIn(CLINIC_LAB_LOCATIONS)
  labLocation?: (typeof CLINIC_LAB_LOCATIONS)[number];

  @IsOptional()
  @IsIn(CLINIC_LAB_INFO_TYPES)
  labType?: (typeof CLINIC_LAB_INFO_TYPES)[number] | null;

  @IsOptional()
  @IsString()
  @MaxLength(CLINIC_LAB_INTEGRATION_VENDOR_CODE_MAX_LENGTH)
  integrationVendorCode?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateClinicLabMachineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_MACHINE_NAME_MAX_LENGTH)
  name: string;

  @IsOptional()
  @IsUUID()
  labInfoId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateClinicLabMachineDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CLINIC_LAB_MACHINE_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsUUID()
  labInfoId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignClinicLabMachineDto {
  @IsOptional()
  @IsUUID()
  labMachineId?: string | null;
}

export class InboundClinicLabSyncObservationResultDto {
  @IsString()
  @MinLength(1)
  testName: string;

  @IsString()
  @MinLength(1)
  universalCode: string;

  @IsString()
  resultValue: string;

  @IsOptional()
  @IsString()
  labComment?: string;

  @IsOptional()
  @IsString()
  vendorResultStatus?: string;

  @IsOptional()
  @IsString()
  observationDate?: string;

  @IsOptional()
  @IsString()
  producerId?: string;

  @IsOptional()
  @IsString()
  producerText?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  referenceRange?: string;

  @IsOptional()
  @IsString()
  abnormalFlags?: string;
}

export class IngestClinicLabSyncObservationRequestDto {
  @IsString()
  @MinLength(1)
  testName: string;

  @IsString()
  @MinLength(1)
  universalCode: string;

  @IsString()
  @MinLength(1)
  patientFirstName: string;

  @IsOptional()
  @IsString()
  patientMiddleName?: string;

  @IsString()
  @MinLength(1)
  patientLastName: string;

  @IsOptional()
  @IsString()
  patientDateOfBirth?: string;

  @IsOptional()
  @IsString()
  patientExternalId?: string;

  @IsOptional()
  @IsString()
  patientAddress?: string;

  @IsOptional()
  @IsString()
  patientPostalCode?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsString()
  patientSexAtBirth?: string;

  @IsString()
  systemReceivedOn: string;

  @IsOptional()
  @IsString()
  specimenReceivedOn?: string;

  @IsOptional()
  @IsString()
  observationDate?: string;

  @IsOptional()
  @IsString()
  placerOrderNumber?: string;

  @IsOptional()
  @IsString()
  orderingProvider?: string;

  @IsOptional()
  @IsString()
  fillerOrderNumber?: string;

  @IsOptional()
  @IsString()
  diagnosticServiceSectionId?: string;

  @IsOptional()
  @IsString()
  vendorResultStatus?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  revisionId?: string;

  @IsOptional()
  @IsString()
  integrationVendorCode?: string;

  @IsOptional()
  @IsUUID()
  labInfoId?: string;

  @ValidateNested({ each: true })
  @Type(() => InboundClinicLabSyncObservationResultDto)
  observations: InboundClinicLabSyncObservationResultDto[];
}

export class LinkClinicLabSyncObservationRequestDto {
  @IsUUID()
  clinicTestResultId: string;
}

export class ListClinicLabSyncObservationRequestsQueryDto {
  @IsOptional()
  @IsIn(['Unlinked', 'Linked', 'Void'])
  status?: 'Unlinked' | 'Linked' | 'Void';
}
