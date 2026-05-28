import { IsString, IsObject, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class PushKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

export class SubscribePushDto {
  @IsString()
  endpoint: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class RegisterNativePushDto {
  @IsString()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
