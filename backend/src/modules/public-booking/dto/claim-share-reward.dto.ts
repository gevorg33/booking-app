import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ClaimShareRewardDto {
  @IsIn(['salon', 'booking'])
  channel: 'salon' | 'booking';

  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
