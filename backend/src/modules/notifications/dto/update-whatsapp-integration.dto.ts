import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWhatsAppIntegrationDto {
  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  businessAccountId?: string;

  /** Omit or empty to keep existing token. */
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  templateConfirmation?: string;

  @IsOptional()
  @IsString()
  templateReminder?: string;

  @IsOptional()
  @IsString()
  templateLanguage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  templateBodyParams?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  templateReminderBodyParams?: number;

  @IsOptional()
  @IsString()
  fallbackTemplate?: string;

  @IsOptional()
  @IsString()
  fallbackLanguage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  fallbackBodyParams?: number;

  /** Clear tenant credentials and use platform default. */
  @IsOptional()
  @IsBoolean()
  usePlatformDefault?: boolean;
}
