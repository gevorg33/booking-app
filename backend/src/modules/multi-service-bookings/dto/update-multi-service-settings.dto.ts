import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { MultiServiceSchedulingMode } from '../entities/multi-service-booking-group.entity.js';

export class UpdateMultiServiceSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  maxServiceCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  maxDurationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  turnoverBufferMinutes?: number;

  @IsOptional()
  @IsIn(['same_visit', 'per_service'])
  schedulingMode?: MultiServiceSchedulingMode;

  /** Pairs of service IDs that cannot be booked together */
  @IsOptional()
  @IsArray()
  incompatiblePairs?: Array<[string, string]>;

  @IsOptional()
  @IsIn(['service', 'category'])
  incompatiblePairMode?: 'service' | 'category';

  /** Pairs of service category IDs that cannot be booked together */
  @IsOptional()
  @IsArray()
  incompatibleCategoryPairs?: Array<[string, string]>;
}
