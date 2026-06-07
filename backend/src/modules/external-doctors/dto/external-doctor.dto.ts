import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ExternalDoctorAddressDto {
  @IsString()
  @MaxLength(255)
  street: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  unit?: string | null;

  @IsString()
  @MaxLength(128)
  city: string;

  @IsString()
  @MaxLength(128)
  province: string;

  @IsString()
  @MaxLength(128)
  country: string;

  @IsString()
  @MaxLength(32)
  postalCode: string;
}

export class CreateExternalDoctorDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinicName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  specialty?: string | null;

  @ValidateNested()
  @Type(() => ExternalDoctorAddressDto)
  address: ExternalDoctorAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fax?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;
}

export class UpdateExternalDoctorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinicName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  specialty?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExternalDoctorAddressDto)
  address?: ExternalDoctorAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fax?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListExternalDoctorsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}
