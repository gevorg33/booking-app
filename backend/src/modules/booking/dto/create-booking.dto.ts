import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { BookingStatus, PaymentStatus } from '../entities/booking.entity.js';

export class CreateBookingDto {
  @IsString()
  employeeId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedEmployeeIds?: string[];

  @IsOptional()
  @IsString()
  virtualMeetingUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  /** Optional explicit resources; defaults to service requirements when omitted */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  /** Consume one appointment from this customer subscription */
  @IsOptional()
  @IsString()
  useSubscriptionId?: string;

  /** Linked package purchase when booking is part of a service package (gap-8.3) */
  @IsOptional()
  @IsString()
  packagePurchaseId?: string;

  /** Linked multi-service group for ad-hoc multi-service bookings (gap-8.7) */
  @IsOptional()
  @IsString()
  multiServiceGroupId?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  linkedEmployeeIds?: string[];

  @IsOptional()
  @IsString()
  virtualMeetingUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  hiddenFromCalendar?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsString()
  customerId?: string | null;

  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}

export class GetAvailabilityDto {
  @IsString()
  serviceId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class CancelBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}
