import { IsIn, IsOptional, IsString } from 'class-validator';

export const SUPPORTED_LOCALES = ['en', 'hy', 'ru'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LOCALES)
  locale?: AppLocale;
}
