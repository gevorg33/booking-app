import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateZendeskIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/i, { message: 'subdomain must be alphanumeric' })
  subdomain?: string;

  /** Zendesk agent/admin email paired with the API token */
  @IsOptional()
  @IsEmail()
  apiUserEmail?: string;

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
  @IsBoolean()
  createTicketOnReview?: boolean;

  /** When set, only reviews at or below this rating (1–5) create tickets. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  reviewTicketMaxRating?: number | null;

  @IsOptional()
  @IsEmail()
  defaultAssigneeEmail?: string;

  @IsOptional()
  @IsBoolean()
  clearCredentials?: boolean;
}
