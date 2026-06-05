import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { normalizeTime24 } from '../../../common/utils/time-format.util.js';
import { Transform } from 'class-transformer';

export class BlockScheduleSingleBlockDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

export class BlockScheduleRepetitiveBlockDto {
  @IsString()
  startDay: string;

  @IsString()
  endDay: string;

  @Transform(({ value }) => normalizeTime24(value))
  @IsString()
  startTime: string;

  @Transform(({ value }) => normalizeTime24(value))
  @IsString()
  endTime: string;

  @IsInt()
  @Min(1)
  @Max(52)
  weeksCount: number;

  @IsBoolean()
  isActiveOnMonday: boolean;

  @IsBoolean()
  isActiveOnTuesday: boolean;

  @IsBoolean()
  isActiveOnWednesday: boolean;

  @IsBoolean()
  isActiveOnThursday: boolean;

  @IsBoolean()
  isActiveOnFriday: boolean;

  @IsBoolean()
  isActiveOnSaturday: boolean;

  @IsBoolean()
  isActiveOnSunday: boolean;
}

export class CreateBlockScheduleDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsBoolean()
  isRepetitive: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlockScheduleSingleBlockDto)
  singleBlock?: BlockScheduleSingleBlockDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlockScheduleRepetitiveBlockDto)
  repetitiveBlock?: BlockScheduleRepetitiveBlockDto;
}

export class UpdateBlockScheduleDto extends CreateBlockScheduleDto {}
