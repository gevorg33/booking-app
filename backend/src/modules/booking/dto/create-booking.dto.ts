import { IsString, IsDateString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
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
