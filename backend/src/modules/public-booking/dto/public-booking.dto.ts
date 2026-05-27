import { IsString, IsDateString, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreatePublicBookingDto {
  @IsString()
  employeeId: string;

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
}

export class GetProviderSlotsQueryDto {
  @IsDateString()
  date: string;
}
