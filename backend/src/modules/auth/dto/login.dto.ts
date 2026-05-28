import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  /** Active tenant — required when the user belongs to multiple businesses. */
  @IsOptional()
  @IsUUID()
  businessId?: string;

  /** Resolve tenant by public booking slug (subdomain). */
  @IsOptional()
  @IsString()
  businessSlug?: string;
}
