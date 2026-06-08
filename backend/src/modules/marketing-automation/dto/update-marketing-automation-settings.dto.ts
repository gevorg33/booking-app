import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateMarketingAutomationSettingsDto {
  @IsOptional()
  @IsBoolean()
  postVisitReviewEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reEngagementEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(365)
  inactiveDaysThreshold?: number;

  @IsOptional()
  @IsBoolean()
  reEngagementEmailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reEngagementSmsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reEngagementPushEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(180)
  minDaysBetweenReEngagement?: number;

  @IsOptional()
  @IsString()
  reEngagementPromoCode?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  reEngagementLoyaltyBonusPoints?: number | null;

  @IsOptional()
  @IsBoolean()
  rebookingNudgeEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  defaultRebookingCadenceDays?: number;

  @IsOptional()
  @IsBoolean()
  rebookingNudgeEmailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  rebookingNudgeSmsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  rebookingNudgePushEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(180)
  minDaysBetweenRebookingNudges?: number;

  @IsOptional()
  @IsString()
  rebookingNudgePromoCode?: string | null;

  @IsOptional()
  @IsBoolean()
  activationConciergeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  activationConciergeEmailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  activationConciergePushEnabled?: boolean;
}
