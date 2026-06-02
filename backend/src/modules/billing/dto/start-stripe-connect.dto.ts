import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class StartStripeConnectDto {
  /** oauth = tenant's own Stripe account; express = platform-managed Express account */
  @IsOptional()
  @IsIn(['oauth', 'express'])
  mode?: 'oauth' | 'express';

  /** ISO country for new Express accounts (e.g. AM, DE, US). Ignored for OAuth. */
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/)
  country?: string;
}
