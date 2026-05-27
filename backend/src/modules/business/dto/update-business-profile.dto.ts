import { IsString, IsOptional, IsEmail, ValidateNested, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessBrandingDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  tagline?: string;
}

export class BusinessSocialDto {
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  x?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  youtube?: string;
}

export class BusinessLocationDto {
  @IsOptional()
  @IsString()
  mapEmbedHtml?: string;
}

export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessBrandingDto)
  branding?: BusinessBrandingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessSocialDto)
  social?: BusinessSocialDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessLocationDto)
  location?: BusinessLocationDto;
}
