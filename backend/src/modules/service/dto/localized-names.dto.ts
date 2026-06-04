import { IsOptional, IsObject } from 'class-validator';
import type { LocalizedNamesInput } from '../../../common/i18n/service-localized-names.util.js';

export class LocalizedNamesDto {
  @IsOptional()
  @IsObject()
  localizedNames?: LocalizedNamesInput;
}
