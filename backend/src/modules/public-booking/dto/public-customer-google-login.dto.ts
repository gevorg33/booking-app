import { IsString } from 'class-validator';

export class PublicCustomerGoogleLoginDto {
  @IsString()
  idToken: string;
}
