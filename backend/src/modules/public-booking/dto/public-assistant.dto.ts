import { IsString, IsOptional, IsArray, ValidateNested, IsObject, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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
}
