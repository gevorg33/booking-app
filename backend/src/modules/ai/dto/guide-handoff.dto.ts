import { IsObject, IsOptional, IsString } from 'class-validator';

export class GuideHandoffDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
