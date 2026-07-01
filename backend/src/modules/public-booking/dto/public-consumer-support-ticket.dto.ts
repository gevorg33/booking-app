import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PublicConsumerSupportTicketDto {
  @IsUUID()
  bookingId: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  message?: string;
}
