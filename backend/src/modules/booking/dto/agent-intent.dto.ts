import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { AgentType } from '../../../engine/agent/interfaces/agent.interfaces.js';

export class AgentIntentDto {
  @IsEnum(AgentType)
  agentType: AgentType;

  @IsString()
  intent: string;

  @IsOptional()
  @IsObject()
  dateRange?: { start: string; end: string };

  @IsOptional()
  @IsBoolean()
  autoExecute?: boolean;
}
