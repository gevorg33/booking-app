import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class LinkServiceProductDto {
  @IsUUID()
  serviceId: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantityPerService?: number;
}
