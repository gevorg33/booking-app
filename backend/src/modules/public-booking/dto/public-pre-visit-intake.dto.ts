import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PublicPreVisitIntakeDraftDto {
  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  questionnaireId?: string | null;
}

export class PublicPreVisitIntakeQueryDto {
  @IsUUID()
  serviceId: string;
}
