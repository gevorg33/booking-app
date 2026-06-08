import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import type { AiEvalLabelOutcome } from '../ai-platform.util.js';

export class AiEvalLabelQueueUpdateDto {
  @IsOptional()
  @IsIn(['execution', 'clarify'])
  labelOutcome?: AiEvalLabelOutcome | null;

  @IsOptional()
  @IsString()
  expectedAction?: string | null;

  @IsOptional()
  @IsString()
  expectedRescuedAction?: string | null;

  @IsOptional()
  @IsString()
  rescueFromAction?: string | null;

  @IsOptional()
  @IsObject()
  expectedParams?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expectedClarifyFields?: string[] | null;
}
