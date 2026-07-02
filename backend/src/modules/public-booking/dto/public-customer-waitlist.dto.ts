import { IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class PublicJoinWaitlistDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateTo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  timeSlot?: string;

  @IsOptional()
  @IsIn(['morning', 'afternoon', 'evening'])
  timeOfDay?: 'morning' | 'afternoon' | 'evening';

  @IsOptional()
  @IsString()
  notes?: string;
}
