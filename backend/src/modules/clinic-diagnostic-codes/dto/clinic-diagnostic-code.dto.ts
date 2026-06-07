import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CLINIC_DIAGNOSTIC_CODE_KINDS,
  CLINIC_DIAGNOSTIC_CODE_SYSTEMS,
} from '../../../common/utils/clinic-diagnostic-code.types.js';
import {
  CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH,
  CLINIC_DIAGNOSTIC_CODE_MAX_LENGTH,
} from '../../../common/utils/clinic-diagnostic-code.util.js';

export class CreateClinicDiagnosticCodeDto {
  @IsIn([...CLINIC_DIAGNOSTIC_CODE_KINDS])
  codeKind: (typeof CLINIC_DIAGNOSTIC_CODE_KINDS)[number];

  @IsIn([...CLINIC_DIAGNOSTIC_CODE_SYSTEMS])
  codeSystem: (typeof CLINIC_DIAGNOSTIC_CODE_SYSTEMS)[number];

  @IsString()
  @MaxLength(CLINIC_DIAGNOSTIC_CODE_MAX_LENGTH)
  code: string;

  @IsString()
  @MaxLength(CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH)
  searchDescription?: string | null;
}

export class UpdateClinicDiagnosticCodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH)
  searchDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListClinicDiagnosticCodesQueryDto {
  @IsOptional()
  @IsIn([...CLINIC_DIAGNOSTIC_CODE_KINDS])
  codeKind?: (typeof CLINIC_DIAGNOSTIC_CODE_KINDS)[number];

  @IsOptional()
  @IsIn([...CLINIC_DIAGNOSTIC_CODE_SYSTEMS])
  codeSystem?: (typeof CLINIC_DIAGNOSTIC_CODE_SYSTEMS)[number];

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
