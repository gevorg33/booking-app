import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsEnum } from 'class-validator';
import { PrepaymentMode } from '../entities/service.entity.js';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(10)
  durationMinutes: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PrepaymentMode)
  prepaymentMode?: PrepaymentMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PrepaymentMode)
  prepaymentMode?: PrepaymentMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}
