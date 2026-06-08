import { IsOptional, IsString, IsIn } from 'class-validator';
import { SUPPORTED_LOCALES } from '../../../common/i18n/messages.js';

export class PublicCustomerGoogleLoginDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  analyticsAnonId?: string;

  @IsOptional()
  @IsString()
  @IsIn([...SUPPORTED_LOCALES])
  preferredLocale?: string;
}
