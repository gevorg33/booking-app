import { IsString, MinLength } from 'class-validator';

export class CompleteStripeOAuthDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
