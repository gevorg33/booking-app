import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ASSISTANT_MODE_VALUES } from '../ai-assistant-mode.util.js';
import { GuideHandoffDto } from './guide-handoff.dto.js';

class HistoryMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class AiCommandDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @IsOptional()
  @IsString()
  @IsIn([...ASSISTANT_MODE_VALUES])
  assistantMode?: 'guide' | 'act';

  /** ai-guide-1.2.5 — skip classifier; dispatch prefilled action + params from product guide handoff. */
  @IsOptional()
  guideHandoff?: GuideHandoffDto;
}
