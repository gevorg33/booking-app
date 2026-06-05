import { IsArray, IsString, IsUUID } from 'class-validator';

export class SetRecommendedProductsDto {
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  productIds: string[];
}
