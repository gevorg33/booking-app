import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateZendeskIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/i, { message: 'subdomain must be alphanumeric' })
  subdomain?: string;

  /** Plaintext API token — encrypted at rest. Omit to keep existing. */
  @IsOptional()
  @IsString()
  @MinLength(10)
  apiToken?: string;

  @IsOptional()
  @IsString()
  widgetKey?: string;

  @IsOptional()
  @IsBoolean()
  widgetEnabledOnDashboard?: boolean;

  @IsOptional()
  @IsBoolean()
  widgetEnabledOnPublicBooking?: boolean;

  @IsOptional()
  @IsBoolean()
  syncCustomersEnabled?: boolean;

  @IsOptional()
  @IsEmail()
  defaultAssigneeEmail?: string;

  @IsOptional()
  @IsBoolean()
  clearCredentials?: boolean;
}
