import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}

export function parseDateRange(
  from?: string,
  to?: string,
): { start: Date; end: Date } {
  const end = to ? new Date(to) : new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = from ? new Date(from) : new Date(end);
  if (!from) start.setUTCDate(start.getUTCDate() - 30);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}
