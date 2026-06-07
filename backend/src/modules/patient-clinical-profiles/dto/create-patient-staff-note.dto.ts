import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePatientStaffNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string | null;
}
