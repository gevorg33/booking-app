import { IsUUID } from 'class-validator';

export class SwitchBusinessDto {
  @IsUUID()
  businessId: string;
}
