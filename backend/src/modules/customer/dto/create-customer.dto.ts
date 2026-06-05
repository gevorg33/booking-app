import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  IsIn,
} from 'class-validator';
import { CUSTOMER_TAGS } from '../customer-tag.constants.js';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  emailReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  smsReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  privacyConsentAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;

  /** Where the customer record was first created (for marketing alerts). */
  @IsOptional()
  @IsIn(['dashboard', 'web_booking', 'app'])
  registrationSource?: 'dashboard' | 'web_booking' | 'app';
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsIn([...CUSTOMER_TAGS], { each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}
