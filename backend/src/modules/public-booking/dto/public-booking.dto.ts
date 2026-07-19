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
  MaxLength,
  IsArray,
  ArrayMinSize,
  ValidateIf,
  IsIn,
  IsUUID,
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

  @IsOptional()
  @IsBoolean()
  aiProcessingOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  thirdPartyIntegrationsOptIn?: boolean;
}

export class CreatePublicBookingDto {
  /** Omitted when the customer chose “any available specialist” — resolved at booking time. */
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Tour vertical — number of travelers (per-person pricing). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(99)
  paxCount?: number;

  /** Clinic vertical — referral letter or doctor notes. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referralNotes?: string;

  /** Clinic vertical — current symptoms or reason for visit. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  symptoms?: string;

  /** Clinic vertical — optional pre-visit intake completed before checkout (lab tests). */
  @IsOptional()
  @IsUUID()
  preVisitIntakeId?: string;

  /** Clinic vertical — token from staff-pushed lab booking request. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clinicOrderToken?: string;

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
  @IsUUID()
  useSubscriptionId?: string;

  /** Purchase a subscription plan as part of checkout (creates customer_subscription) */
  @IsOptional()
  @IsUUID()
  purchasePlanId?: string;

  /** When purchasing a plan, also consume first appointment on this booking (default true) */
  @IsOptional()
  @IsBoolean()
  useSubscriptionCreditOnPurchase?: boolean;

  /** Pay in cash at visit when business accepts cash and no online prepayment is due */
  @IsOptional()
  @IsString()
  paymentMethod?: 'online' | 'cash';

  /** e2e-bug.18 — which client started Stripe checkout (affects success/cancel URLs). */
  @IsOptional()
  @IsIn(['web', 'consumer'])
  clientSurface?: 'web' | 'consumer';

  /** Optional origin (http/https) for consumer return; must match CONSUMER_APP_URL / allowlist. */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnOrigin?: string;
}

export class PublicBookingQuoteDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(99)
  paxCount?: number;

  @IsOptional()
  @IsUUID()
  purchasePlanId?: string;

  /** e2e-bug.28 — preview $0 when redeeming an existing subscription credit */
  @IsOptional()
  @IsUUID()
  useSubscriptionId?: string;

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

export class GetServiceBookableDatesQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

export class GetServiceSlotProvidersQueryDto {
  @IsDateString()
  startTime: string;
}

/** e2e-bug.116 — validate for-slot query before Invalid Date hits Postgres. */
export class GetServicesForSlotQueryDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class PackageBookingLineDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  startTime: string;
}

export class BookPublicPackageDto {
  @IsUUID()
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

  /** e2e-bug.18 — which client started Stripe checkout (affects success/cancel URLs). */
  @IsOptional()
  @IsIn(['web', 'consumer'])
  clientSurface?: 'web' | 'consumer';

  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnOrigin?: string;
}

export class PublicPackageQuoteDto {
  @IsUUID()
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
  @IsUUID('4', { each: true })
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
  @IsUUID('4', { each: true })
  serviceIds: string[];
}

export class MultiServiceBlockProvidersQueryDto {
  @IsDateString()
  startTime: string;

  @Transform(({ value }) => parseServiceIdsQuery(value))
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeLaterDays?: boolean;
}

export class MultiServiceBookingLineDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  startTime: string;
}

export class BookPublicMultiServiceDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  serviceIds: string[];

  /** Same-visit block start (required when schedulingMode is same_visit) */
  @IsOptional()
  @IsDateString()
  blockStartTime?: string;

  @IsOptional()
  @IsUUID()
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

  /** e2e-bug.18 — which client started Stripe checkout (affects success/cancel URLs). */
  @IsOptional()
  @IsIn(['web', 'consumer'])
  clientSurface?: 'web' | 'consumer';

  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnOrigin?: string;
}

export class PublicMultiServiceQuoteDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
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

export class RecordProductRecommendationEventDto {
  @IsIn(['shown', 'clicked'])
  event: 'shown' | 'clicked';

  /** Inventory product ids are not always UUID-shaped in fixtures/legacy data. */
  @IsString()
  productId: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsString()
  surface?: string;
}
