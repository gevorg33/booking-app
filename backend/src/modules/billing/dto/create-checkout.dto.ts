import { IsIn, IsOptional, IsString } from 'class-validator';

export type BillingInterval = 'month' | 'year';

export class CreateCheckoutDto {
  @IsString()
  planId: string;

  @IsOptional()
  @IsIn(['month', 'year'])
  billingInterval?: BillingInterval;
}
