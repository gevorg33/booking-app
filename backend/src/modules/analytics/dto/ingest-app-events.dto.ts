import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AppEventInputDto {
  @IsString()
  @MaxLength(64)
  event: string;

  @IsString()
  @MaxLength(64)
  anonId: string;

  @IsString()
  @MaxLength(16)
  platform: string;

  @IsString()
  @MaxLength(32)
  appSurface: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantSlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  startType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  userType?: string;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}

export class IngestAppEventsDto {
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantSlug?: string;

  @IsBoolean()
  consentGranted: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AppEventInputDto)
  events: AppEventInputDto[];
}
