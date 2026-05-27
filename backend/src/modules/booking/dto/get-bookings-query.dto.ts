import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../entities/booking.entity.js';

export class GetBookingsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  /** Comma-separated booking statuses. */
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['startTime', 'customerName', 'serviceName', 'employeeName', 'status', 'createdAt', 'updatedAt'])
  sortBy?: 'startTime' | 'customerName' | 'serviceName' | 'employeeName' | 'status' | 'createdAt' | 'updatedAt';

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
