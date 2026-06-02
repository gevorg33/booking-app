import {
  IsString,
  IsDateString,
  IsOptional,
  IsEmail,
  ValidateNested,
  IsBoolean,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

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

  /** Hours before appointment to send reminder; null = no reminder. Requires business to allow customer choice. */
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(168)
  reminderHoursBefore?: number | null;

  @IsOptional()
  @IsBoolean()
  privacyConsentAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
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

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;

  /** Use an existing customer subscription credit for this booking */
  @IsOptional()
  @IsString()
  useSubscriptionId?: string;

  /** Purchase a subscription plan as part of checkout (creates customer_subscription) */
  @IsOptional()
  @IsString()
  purchasePlanId?: string;

  /** When purchasing a plan, also consume first appointment on this booking (default true) */
  @IsOptional()
  @IsBoolean()
  useSubscriptionCreditOnPurchase?: boolean;

  /** Pay in cash at visit when business accepts cash and no online prepayment is due */
  @IsOptional()
  @IsString()
  paymentMethod?: 'online' | 'cash';
}

export class PublicBookingQuoteDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  purchasePlanId?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;
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

export class PackageBookingLineDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsDateString()
  startTime: string;
}

export class BookPublicPackageDto {
  @IsString()
  packageId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageBookingLineDto)
  lines: PackageBookingLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested()
  @Type(() => PublicCustomerDto)
  customer: PublicCustomerDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;
}

export class PublicPackageQuoteDto {
  @IsString()
  packageId: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;
}

export class MultiServiceSelectionDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  serviceIds: string[];
}

export class PackageBlockSlotsQueryDto {
  @IsDateString()
  date: string;
}

export class PackageBlockProvidersQueryDto {
  @IsDateString()
  startTime: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeLaterDays?: boolean;
}

export class MultiServiceBlockSlotsQueryDto {
  @IsDateString()
  date: string;

  @Transform(({ value }) => parseServiceIdsQuery(value))
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  serviceIds: string[];
}

export class MultiServiceBlockProvidersQueryDto {
  @IsDateString()
  startTime: string;

  @Transform(({ value }) => parseServiceIdsQuery(value))
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  serviceIds: string[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeLaterDays?: boolean;
}

export class MultiServiceBookingLineDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsDateString()
  startTime: string;
}

export class BookPublicMultiServiceDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  serviceIds: string[];

  /** Same-visit block start (required when schedulingMode is same_visit) */
  @IsOptional()
  @IsDateString()
  blockStartTime?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  /** Per-service lines (required when schedulingMode is per_service) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiServiceBookingLineDto)
  lines?: MultiServiceBookingLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateNested()
  @Type(() => PublicCustomerDto)
  customer: PublicCustomerDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  markPaid?: boolean;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;
}

export class PublicMultiServiceQuoteDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  serviceIds: string[];

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loyaltyPointsToRedeem?: number;
}

export function parseServiceIdsQuery(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.map(String)
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of raw) {
    const id = String(entry ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
