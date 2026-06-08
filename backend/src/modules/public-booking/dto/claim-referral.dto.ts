import { IsString, MaxLength, MinLength } from 'class-validator';

export class ClaimReferralCodeDto {
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  referralCode: string;
}
