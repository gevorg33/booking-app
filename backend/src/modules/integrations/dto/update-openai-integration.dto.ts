import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOpenAiIntegrationDto {
  @IsOptional()
  @IsBoolean()
  usePlatformDefault?: boolean;

  /** Plaintext OpenAI API key — encrypted before storage. Omit to keep existing. */
  @IsOptional()
  @IsString()
  apiKey?: string;
}
