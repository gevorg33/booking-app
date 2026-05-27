import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateStripeIntegrationDto {
  @IsOptional()
  @IsString()
  connectAccountId?: string;

  /** Remove connected Stripe account. */
  @IsOptional()
  @IsBoolean()
  disconnect?: boolean;
}
