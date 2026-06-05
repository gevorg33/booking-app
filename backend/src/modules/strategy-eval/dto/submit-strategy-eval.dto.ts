import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { HipaaAnswer } from '../hipaa-baa.constants.js';

const HIPAA_ANSWERS = ['yes', 'no', 'unsure'] as const;

export class SubmitHipaaEvalDto {
  @IsObject()
  answers!: Record<string, HipaaAnswer>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsIn(['defer', 'wellness_only', 'pursue_baa'])
  decision?: 'defer' | 'wellness_only' | 'pursue_baa';
}

export class SubmitMarketplaceEvalDto {
  @IsObject()
  criterionWeights!: Record<string, number>;

  @IsOptional()
  directoryOptIn?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsIn(['software_only', 'partner_directory', 'full_marketplace', 'undecided'])
  decision?:
    | 'software_only'
    | 'partner_directory'
    | 'full_marketplace'
    | 'undecided';
}
