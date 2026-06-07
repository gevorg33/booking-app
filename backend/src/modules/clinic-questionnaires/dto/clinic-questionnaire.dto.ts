import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CLINIC_QUESTION_TYPES,
  CLINIC_QUESTION_VALIDATION_MAX_DATES,
} from '../../../common/utils/clinic-questionnaire.types.js';

export class CreateClinicQuestionnaireDto {
  @IsString()
  @MaxLength(64)
  code: string;

  @IsString()
  @MaxLength(128)
  internalName: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  introTitle?: string | null;

  @IsOptional()
  @IsString()
  introBody?: string | null;
}

export class UpdateClinicQuestionnaireDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  internalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  introTitle?: string | null;

  @IsOptional()
  @IsString()
  introBody?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ClinicQuestionnaireAnswerOptionInputDto {
  @IsString()
  @MaxLength(255)
  display: string;

  @IsString()
  @MaxLength(255)
  value: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sequence?: number;
}

export class ClinicQuestionnaireQuestionInputDto {
  @IsString()
  @MaxLength(64)
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  parentKey?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence: number;

  @IsIn([...CLINIC_QUESTION_TYPES])
  type: string;

  @IsOptional()
  @IsString()
  text?: string | null;

  @IsOptional()
  @IsString()
  subText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeholder?: string | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  repeatEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxLength?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxCount?: number | null;

  @IsOptional()
  @IsString()
  regexPattern?: string | null;

  @IsOptional()
  @IsString()
  validationErrorMessage?: string | null;

  @IsOptional()
  @IsIn([...CLINIC_QUESTION_VALIDATION_MAX_DATES])
  validationMaxDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicQuestionnaireAnswerOptionInputDto)
  answerOptions?: ClinicQuestionnaireAnswerOptionInputDto[];
}

export class ClinicQuestionnaireConstraintInputDto {
  @IsString()
  @MaxLength(64)
  questionKey: string;

  @IsString()
  @MaxLength(64)
  constraintQuestionKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  answerOptionValue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  staticAnswer?: string | null;
}

export class ReplaceClinicQuestionnaireDefinitionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClinicQuestionnaireQuestionInputDto)
  questions: ClinicQuestionnaireQuestionInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicQuestionnaireConstraintInputDto)
  constraints?: ClinicQuestionnaireConstraintInputDto[];
}

export class StartClinicQuestionnaireResponseDto {
  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;
}

export class SubmitClinicQuestionnaireAnswersDto {
  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsArray()
  @IsString({ each: true })
  values: string[];
}
