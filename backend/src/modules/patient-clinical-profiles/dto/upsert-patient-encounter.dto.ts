import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertPatientEncounterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(16000)
  visitNote: string;
}

export class UpsertPatientEncounterByBookingDto extends UpsertPatientEncounterDto {}
