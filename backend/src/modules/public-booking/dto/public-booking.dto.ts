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
  IsArray,
  ArrayMinSize,
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

function parseServiceIdsQuery(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}
