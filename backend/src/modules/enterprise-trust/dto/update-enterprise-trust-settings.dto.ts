import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEnterpriseTrustSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalBusinessName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  registeredAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string | null;

  @IsOptional()
  @IsEmail()
  dpoEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  euRepresentative?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  privacyPolicyEffectiveDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  dpaEffectiveDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customDataProcessingNotes?: string | null;
}
