import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PublicCustomerNotifyRunningLateDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  minutesLate?: number;
}
