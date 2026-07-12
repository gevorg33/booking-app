import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class PublicCustomerRescheduleBookingDto {
  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class PublicBookingManageQueryDto {
  @IsString()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManageCancelDto {
  @IsString()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManageRescheduleDto extends PublicCustomerRescheduleBookingDto {
  @IsString()
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
  @IsString({ each: true })
  bookingIds?: string[];
}
