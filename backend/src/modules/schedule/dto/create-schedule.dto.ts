import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsEnum,
  MaxLength,
  ArrayNotEmpty,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/schedule-template.entity.js';
import { OverrideType } from '../entities/schedule-override.entity.js';
import { TemplatePeriodType } from '../entities/scheduling-template-period.entity.js';

class TimeSlotRangeDto {
  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

class BreakSlotDto {
  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class CreateScheduleTemplateDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsNumber()
  dayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotRangeDto)
  workingHours?: TimeSlotRangeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakSlotDto)
  breaks?: BreakSlotDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimePeriodDto)
  timePeriods?: TimePeriodDto[];
}

export class TimePeriodDto {
  @IsString()
  startTime: string; // HH:mm

  @IsString()
  endTime: string; // HH:mm

  @IsEnum(TemplatePeriodType)
  type: TemplatePeriodType;

  @IsOptional()
  @IsString()
  placeholderLabel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActiveOnMonday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnTuesday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnWednesday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnThursday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnFriday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnSaturday?: boolean;

  @IsOptional()
  @IsBoolean()
  isActiveOnSunday?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAppointmentCount?: number;
}

export class UpdateScheduleTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimePeriodDto)
  timePeriods?: TimePeriodDto[];
}

export class ApplyTemplateDto {
  @IsString()
  templateId: string;

  @IsString()
  employeeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  applyDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  repeatWeeksCount?: number;
}

export class DeleteTemplatesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  templateIds: string[];
}

export class GetTemplatesQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsString()
  searchString?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyCompleted?: boolean;
}

export class DirectSchedulePeriodDto {
  @IsString()
  startTime: string; // HH:mm

  @IsString()
  endTime: string; // HH:mm

  @IsEnum(TemplatePeriodType)
  type: TemplatePeriodType;

  @IsOptional()
  @IsString()
  placeholderLabel?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAppointmentCount?: number;
}

export class CreateDirectScheduleDto {
  @IsString()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DirectSchedulePeriodDto)
  periods: DirectSchedulePeriodDto[];
}

export class AssignScheduleDto {
  @IsString()
  employeeId: string;

  @IsString()
  templateId: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class CreateOverrideDto {
  @IsString()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsEnum(OverrideType)
  type: OverrideType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotRangeDto)
  customHours?: TimeSlotRangeDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
