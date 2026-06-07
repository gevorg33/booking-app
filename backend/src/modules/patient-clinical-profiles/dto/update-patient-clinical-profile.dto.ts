import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePatientClinicalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  allergies?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  chronicProblems?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  emergencyContactRelationship?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  bloodType?: string | null;

  @IsOptional()
  @IsString()
  referringExternalDoctorId?: string | null;
}
