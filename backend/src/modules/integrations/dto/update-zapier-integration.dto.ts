import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateZapierIntegrationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  hookDescription?: string;
}

export class CreateZapierWebhookDto {
  @IsString()
  url: string;

  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
