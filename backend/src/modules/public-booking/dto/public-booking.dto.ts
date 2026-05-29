import { IsString, IsDateString, IsOptional, IsEmail, ValidateNested, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicCustomerDto {
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
}

export class CreatePublicBookingDto {
  /** Omitted when the customer chose “any available specialist” — resolved at booking time. */
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString()
  serviceId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested()
  @Type(() => PublicCustomerDto)
  customer: PublicCustomerDto;

  /** Internal — set when fulfilling paid checkout */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;
}

export class ConfirmBookingPaymentDto {
  @IsString()
  sessionId: string;
}

export class GetProviderSlotsQueryDto {
  @IsDateString()
  date: string;
}

export class GetServiceSlotsQueryDto {
  @IsDateString()
  date: string;
}

export class GetServiceSlotProvidersQueryDto {
  @IsDateString()
  startTime: string;
}
