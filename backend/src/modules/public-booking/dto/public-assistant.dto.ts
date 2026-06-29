import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ASSISTANT_MODE_VALUES } from '../ai/ai-assistant-mode.util.js';

class AssistantHistoryMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class PublicAssistantDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantHistoryMessageDto)
  history?: AssistantHistoryMessageDto[];

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'hy', 'ru'])
  locale?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ASSISTANT_MODE_VALUES])
  assistantMode?: 'guide' | 'act';
}
