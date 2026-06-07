import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionClinicTestResultDto {
  @IsString()
  @MaxLength(32)
  toStatus!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
