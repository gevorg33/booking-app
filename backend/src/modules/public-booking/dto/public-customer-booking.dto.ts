import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class PublicCustomerRescheduleBookingDto {
  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

/** e2e-bug.117 — validate bookingId before Postgres uuid columns 500. */
export class PublicBookingManageQueryDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManageCancelDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManageRescheduleDto extends PublicCustomerRescheduleBookingDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicCustomerBulkCancelBookingsDto {
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  bookingIds?: string[];
}

export class PublicReviewContextQueryDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}
