import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
  IsIn,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetBusinessTypeDto {
  @IsString()
  @MaxLength(64)
  businessType: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CatalogServiceDraftDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(10)
  durationMinutes: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

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
}

export class CatalogCategoryDraftDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogServiceDraftDto)
  services: CatalogServiceDraftDto[];
}

export class ApplyCatalogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogCategoryDraftDto)
  categories: CatalogCategoryDraftDto[];
}
