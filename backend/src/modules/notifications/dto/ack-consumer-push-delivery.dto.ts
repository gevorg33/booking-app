import { IsIn, IsString } from 'class-validator';

export class AckConsumerPushDeliveryDto {
  @IsString()
  deliveryId: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
