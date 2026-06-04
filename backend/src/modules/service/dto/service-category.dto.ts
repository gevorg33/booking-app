import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { LocalizedNamesDto } from './localized-names.dto.js';

export class CreateServiceCategoryDto extends LocalizedNamesDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateServiceCategoryDto extends LocalizedNamesDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
