import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PushClinicLabBookingRequestDto {
  @IsUUID()
  collectionServiceId: string;
}

export class CreateClinicCatalogOrderItemDto {
  @IsIn(['test_type', 'test_panel'])
  type: 'test_type' | 'test_panel';

  @IsOptional()
  @IsUUID()
  testTypeId?: string;

  @IsOptional()
  @IsUUID()
  testPanelId?: string;

  @IsString()
  @MaxLength(255)
  label: string;
}

export class CreateClinicCatalogOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClinicCatalogOrderItemDto)
  items: CreateClinicCatalogOrderItemDto[];
}

export class BookClinicLabCollectionDto {
  @IsUUID()
  collectionServiceId: string;

  @IsUUID()
  employeeId: string;

  @IsDateString()
  startTime: string;
}
