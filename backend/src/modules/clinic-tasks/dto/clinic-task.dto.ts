import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CLINIC_TASK_PRIORITIES,
  CLINIC_TASK_STATUSES,
  CLINIC_TASK_TYPES,
} from '../../../common/utils/clinic-task.types.js';

export class ClinicTaskLinksDto {
  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;

  @IsOptional()
  @IsUUID()
  testOrderId?: string | null;

  @IsOptional()
  @IsUUID()
  testResultId?: string | null;

  @IsOptional()
  @IsUUID()
  specimenId?: string | null;

  @IsOptional()
  @IsUUID()
  encounterId?: string | null;
}

export class CreateClinicTaskDto extends ClinicTaskLinksDto {
  @IsIn([...CLINIC_TASK_TYPES])
  taskType: (typeof CLINIC_TASK_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn([...CLINIC_TASK_PRIORITIES])
  priority?: (typeof CLINIC_TASK_PRIORITIES)[number];

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeEmployeeId?: string | null;
}

export class UpdateClinicTaskDto extends ClinicTaskLinksDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn([...CLINIC_TASK_PRIORITIES])
  priority?: (typeof CLINIC_TASK_PRIORITIES)[number];

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsIn([...CLINIC_TASK_STATUSES])
  status?: (typeof CLINIC_TASK_STATUSES)[number];

  @IsOptional()
  @IsUUID()
  assigneeEmployeeId?: string | null;
}

export class ListClinicTasksQueryDto {
  @IsOptional()
  @IsIn([...CLINIC_TASK_STATUSES])
  status?: (typeof CLINIC_TASK_STATUSES)[number];

  @IsOptional()
  @IsIn([...CLINIC_TASK_TYPES])
  taskType?: (typeof CLINIC_TASK_TYPES)[number];

  @IsOptional()
  @IsUUID()
  assigneeEmployeeId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @IsOptional()
  @IsDateString()
  dueAfter?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class AssignClinicTaskDto {
  @IsUUID()
  assigneeEmployeeId: string;
}

export class CompleteClinicTaskDto {
  @IsOptional()
  @IsString()
  notes?: string | null;
}
