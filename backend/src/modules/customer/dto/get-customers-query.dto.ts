import {
  IsOptional,
  IsString,
  IsIn,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../../booking/entities/booking.entity.js';
import { CUSTOMER_TAGS } from '../customer-tag.constants.js';

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

  /** Single customer tag filter */
  @IsOptional()
  @IsIn([...CUSTOMER_TAGS])
  tags?: string;

  @IsOptional()
  @IsIn(['vip', 'at_risk', 'high_no_show', 'new'])
  segment?: 'vip' | 'at_risk' | 'high_no_show' | 'new';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVip?: boolean;

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
