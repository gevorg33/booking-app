import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignClinicPreVisitIntakeDto {
  @IsOptional()
  @IsUUID()
  bookingId?: string | null;

  @IsOptional()
  @IsUUID()
  questionnaireId?: string | null;
}

export class SubmitClinicPreVisitIntakeAnswersDto {
  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsArray()
  @IsString({ each: true })
  values: string[] = [];
}
