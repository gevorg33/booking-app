import { IsBoolean, IsOptional } from 'class-validator';

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
}
