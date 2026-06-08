import { IsOptional, IsString } from 'class-validator';

export class PublicCustomerGoogleLoginDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  analyticsAnonId?: string;
}
