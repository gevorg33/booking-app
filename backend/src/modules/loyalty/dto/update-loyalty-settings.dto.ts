import { IsNumber, Min, Max, IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateLoyaltySettingsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  earnPercentCashback: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  earnExcludedServiceIds?: string[];
}
