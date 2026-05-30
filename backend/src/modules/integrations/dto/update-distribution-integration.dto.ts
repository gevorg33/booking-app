import { IsBoolean, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateDistributionIntegrationDto {
  @IsOptional()
  @IsBoolean()
  googleReserveEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  googleMerchantId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googlePartnerNotes?: string;

  @IsOptional()
  @IsBoolean()
  metaBookingEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  facebookPageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookPageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagramUsername?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  metaBookingButtonLabel?: string;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'telegramBotUsername must be a valid bot username' })
  telegramBotUsername?: string;

  @IsOptional()
  @IsBoolean()
  whatsappBookingEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappBusinessPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  whatsappBookingMessage?: string;
}
