import { IsIn, IsString } from 'class-validator';

export class RegisterConsumerNativePushDto {
  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
