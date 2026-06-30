import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ASSISTANT_MODE_VALUES } from '../../ai/ai-assistant-mode.util.js';

class ChatMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ProviderAiCommandDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @IsIn([...ASSISTANT_MODE_VALUES])
  assistantMode?: 'guide' | 'act';
}

export class ProviderAiConfirmDto {
  @IsString()
  action:
    | 'cancel_bookings'
    | 'update_bookings'
    | 'mark_no_shows'
    | 'payment_sweep';

  @IsArray()
  @IsString({ each: true })
  bookingIds: string[];

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
