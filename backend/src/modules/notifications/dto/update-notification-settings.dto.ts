import { IsBoolean, IsOptional, IsArray, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sendConfirmationEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  sendConfirmationWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder24hEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder1hEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder24hSms?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder1hSms?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder24hWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder1hWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  reminderImmediateWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyBusinessOnCustomerBookingChange?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCustomerReminderChoice?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(168, { each: true })
  customerReminderOptionsHours?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  defaultCustomerReminderHours?: number | null;

  @IsOptional()
  @IsBoolean()
  emailOnNewCustomerRegistration?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingTeamEmails?: string[];
}
