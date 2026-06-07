import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsIn,
  IsInt,
} from 'class-validator';
import { PrepaymentMode } from '../entities/service.entity.js';
import { LocalizedNamesDto } from './localized-names.dto.js';

export class CreateServiceDto extends LocalizedNamesDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNumber()
  @Min(10)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PrepaymentMode)
  prepaymentMode?: PrepaymentMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsIn(['tour', 'consultation', 'lab_test', 'procedure'])
  serviceType?: 'tour' | 'consultation' | 'lab_test' | 'procedure';

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxGroupSize?: number;

  @IsOptional()
  @IsIn(['easy', 'moderate', 'challenging'])
  difficulty?: 'easy' | 'moderate' | 'challenging';

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsString()
  includedItems?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsString()
  preparationNotes?: string;

  @IsOptional()
  @IsUUID()
  clinicDiagnosticCodeId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRatePercent?: number | null;
}

export class UpdateServiceDto extends LocalizedNamesDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(10)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PrepaymentMode)
  prepaymentMode?: PrepaymentMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsIn(['tour', 'consultation', 'lab_test', 'procedure', ''])
  serviceType?: 'tour' | 'consultation' | 'lab_test' | 'procedure' | '';

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxGroupSize?: number;

  @IsOptional()
  @IsIn(['easy', 'moderate', 'challenging', ''])
  difficulty?: 'easy' | 'moderate' | 'challenging' | '';

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsString()
  includedItems?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsString()
  preparationNotes?: string;

  @IsOptional()
  @IsUUID()
  clinicDiagnosticCodeId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRatePercent?: number | null;
}
