import { IsNumber, Min, Max } from 'class-validator';

export class UpdateLoyaltySettingsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  earnPercentCashback: number;
}
