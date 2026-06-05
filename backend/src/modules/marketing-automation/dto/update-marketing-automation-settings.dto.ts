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
  @IsInt()
  @Min(7)
  @Max(180)
  minDaysBetweenReEngagement?: number;

  @IsOptional()
  @IsString()
  reEngagementPromoCode?: string | null;
}
