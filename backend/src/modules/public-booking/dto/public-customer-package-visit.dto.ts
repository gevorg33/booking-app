import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class PublicCustomerPackageVisitLineDto {
  @IsString()
  bookingId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class PublicCustomerReschedulePackageVisitDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PublicCustomerPackageVisitLineDto)
  lines: PublicCustomerPackageVisitLineDto[];
}

export class PublicBookingManagePackageCancelDto {
  @IsString()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManagePackageRescheduleDto extends PublicCustomerReschedulePackageVisitDto {
  @IsString()
  bookingId: string;

  @IsString()
  token: string;
}
