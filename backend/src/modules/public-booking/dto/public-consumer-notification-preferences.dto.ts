import { IsBoolean, IsOptional } from 'class-validator';

/** adopt-4.8 — per-category consumer push preferences. */
export class UpdatePublicConsumerNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  pushReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  pushOffers?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNews?: boolean;
}
