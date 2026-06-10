import { IsIn, IsString } from 'class-validator';
import { SUPPORTED_LOCALES } from '../../../common/i18n/messages.js';

/** catalog-notify-1.1 — persist customer app / public booking language choice. */
export class UpdatePublicCustomerPreferredLocaleDto {
  @IsString()
  @IsIn([...SUPPORTED_LOCALES])
  preferredLocale: string;
}
