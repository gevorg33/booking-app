import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClinicTestTypeDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  abbreviation?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsString()
  preparationNotes?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string | null;

  @IsOptional()
  @IsNumber()
  normalLow?: number | null;

  @IsOptional()
  @IsNumber()
  normalHigh?: number | null;

  @IsOptional()
  @IsUUID()
  clinicDiagnosticCodeId?: string | null;
}

export class UpdateClinicTestTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  abbreviation?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsString()
  preparationNotes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  serviceId?: string | null;

  @IsOptional()
  @IsNumber()
  normalLow?: number | null;

  @IsOptional()
  @IsNumber()
  normalHigh?: number | null;

  @IsOptional()
  @IsUUID()
  clinicDiagnosticCodeId?: string | null;
}

export class CreateClinicTestPanelDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  abbreviation?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class UpdateClinicTestPanelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  abbreviation?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertClinicTestPanelItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicTestPanelItemInputDto)
  items: ClinicTestPanelItemInputDto[];
}

export class ClinicTestPanelItemInputDto {
  @IsUUID()
  testTypeId: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class ImportClinicTestCatalogCsvDto {
  @IsString()
  csv: string;
}
