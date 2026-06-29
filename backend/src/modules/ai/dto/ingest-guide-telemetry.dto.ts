import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  GUIDE_TELEMETRY_EVENT_NAMES,
  GUIDE_TELEMETRY_SURFACE_VALUES,
} from '../guide/guide-telemetry.fixtures.js';

export class GuideTelemetryEventDto {
  @IsIn(GUIDE_TELEMETRY_EVENT_NAMES)
  event!: (typeof GUIDE_TELEMETRY_EVENT_NAMES)[number];

  @IsIn(GUIDE_TELEMETRY_SURFACE_VALUES)
  surface!: (typeof GUIDE_TELEMETRY_SURFACE_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  topicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  stepIndex?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  totalSteps?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  handoffAction?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  relatedActionsCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issueCodes?: string[];
}

export class IngestGuideTelemetryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuideTelemetryEventDto)
  events!: GuideTelemetryEventDto[];
}
