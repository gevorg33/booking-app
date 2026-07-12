import { IsOptional, IsString, MinLength } from 'class-validator';

/** ai-cmd-customer-6.14.3 — customer self-service name/phone update. */
export class PublicCustomerUpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  phone?: string;
}
