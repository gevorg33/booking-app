import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
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
