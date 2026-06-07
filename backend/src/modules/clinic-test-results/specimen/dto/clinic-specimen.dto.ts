import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionClinicSpecimenDto {
  @IsString()
  @MaxLength(32)
  toStatus!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  v1ShortPath?: boolean;
}
