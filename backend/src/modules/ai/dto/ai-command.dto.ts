import { IsString, IsOptional, IsArray, ValidateNested, IsObject, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

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
}
