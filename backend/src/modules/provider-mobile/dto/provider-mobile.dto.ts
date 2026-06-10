import {
  IsString,
  ValidateNested,
  IsIn,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BookingStatus,
  PaymentStatus,
} from '../../booking/entities/booking.entity.js';

class PushKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class SubscribePushDto {
  @IsString()
  endpoint: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class RegisterNativePushDto {
  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}

export class UpdateProviderBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

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
  @IsDateString()
  expectedUpdatedAt?: string;
}

export class ReassignProviderBookingDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}

export class CancelProviderBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  expectedUpdatedAt?: string;
}

export class SuggestCancelNoteDto {
  @IsOptional()
  @IsString()
  draft?: string;

  @IsOptional()
  @IsString()
  prompt?: string;
}

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class CreateProviderCustomerStaffNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body: string;
}

export class ProviderMyStatsQueryDto {
  @IsOptional()
  @IsIn(['week', 'month'])
  period?: 'week' | 'month';

  @IsOptional()
  @IsIn(['mine', 'team'])
  scope?: 'mine' | 'team';
}

export class ProviderReviewsInboxQueryDto {
  @IsOptional()
  last30d?: string;

  @IsOptional()
  lowRating?: string;
}

export class ProviderRunningLateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  minutesLate?: number;
}

export class CreateProviderSelfBlockDto {
  @IsString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  placeholder?: string;
}

export class CreateProviderTimeOffRequestDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  dailyStartTime?: string;

  @IsOptional()
  @IsString()
  dailyEndTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReviewProviderTimeOffRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNotes?: string;
}
