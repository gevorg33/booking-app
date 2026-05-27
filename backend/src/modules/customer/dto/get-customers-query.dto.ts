import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../../booking/entities/booking.entity.js';

export class GetCustomersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Comma-separated booking statuses — customers with at least one matching appointment. */
  @IsOptional()
  @IsString()
  bookingStatus?: string;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

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
}

export function parseBookingStatusFilter(raw?: string): BookingStatus[] {
  if (!raw?.trim()) return [];
  const allowed = new Set(Object.values(BookingStatus));
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is BookingStatus => allowed.has(s as BookingStatus));
}
