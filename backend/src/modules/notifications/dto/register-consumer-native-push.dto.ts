import { IsIn, IsOptional, IsString } from 'class-validator';

export class RegisterConsumerNativePushDto {
  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';

  @IsOptional()
  @IsString()
  analyticsAnonId?: string;

  @IsOptional()
  @IsIn(['full', 'provisional', 'default_on'])
  permissionState?: 'full' | 'provisional' | 'default_on';
}
