import { IsString, IsOptional, IsEmail, ValidateNested, IsHexColor, IsIn, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicProfileLocaleContentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

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

export class BusinessEmbedDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  defaultPath?: string;
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

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessEmbedDto)
  embed?: BusinessEmbedDto;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'hy', 'ru'])
  locale?: string;

  /** Per-locale overrides for public booking profile text (name, description, tagline, address). */
  @IsOptional()
  @IsObject()
  publicProfileLocales?: Record<string, PublicProfileLocaleContentDto | undefined>;
}
