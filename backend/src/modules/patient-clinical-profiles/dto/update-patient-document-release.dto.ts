import { IsBoolean } from 'class-validator';

export class UpdatePatientDocumentReleaseDto {
  @IsBoolean()
  releasedToPatient: boolean;
}
