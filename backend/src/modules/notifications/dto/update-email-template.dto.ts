import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { NotificationEmailTemplateKey } from '../notification-email-template.types.js';

export class UpdateEmailTemplateDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  bodyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  bodyHtml?: string;
}

export class CustomEmailVariableDto {
  @IsString()
  @MaxLength(48)
  key!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(2000)
  defaultValue!: string;
}

export class ReplaceCustomEmailVariablesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomEmailVariableDto)
  variables!: CustomEmailVariableDto[];
}

export const EMAIL_TEMPLATE_KEYS: NotificationEmailTemplateKey[] = [
  'booking_confirmation',
  'booking_confirmation_grouped',
  'booking_reminder',
  'booking_cancellation',
  'review_request',
  'gift_card_recipient',
  'gift_card_purchaser_receipt',
];
