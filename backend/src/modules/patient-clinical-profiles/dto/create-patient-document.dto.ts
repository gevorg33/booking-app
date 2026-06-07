import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  PATIENT_DOCUMENT_CATEGORIES,
  type PatientDocumentCategory,
} from '../../../common/utils/patient-document-category.util.js';

export class CreatePatientDocumentDto {
  @IsIn(PATIENT_DOCUMENT_CATEGORIES)
  category: PatientDocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;
}
