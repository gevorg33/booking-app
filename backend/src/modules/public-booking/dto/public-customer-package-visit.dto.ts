import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class PublicCustomerPackageVisitLineDto {
  @IsUUID()
  bookingId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsUUID()
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
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}

export class PublicBookingManagePackageRescheduleDto extends PublicCustomerReschedulePackageVisitDto {
  @IsUUID()
  bookingId: string;

  @IsString()
  token: string;
}
