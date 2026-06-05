import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PublicCustomerJwtPayload } from './public-customer-auth.types.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';

@Injectable()
export class PublicCustomerJwtStrategy extends PassportStrategy(
  Strategy,
  'public-customer-jwt',
) {
  constructor(
    configService: ConfigService,
    private publicCustomerAuthService: PublicCustomerAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('app.jwtSecret')!,
    });
  }

  async validate(payload: PublicCustomerJwtPayload) {
    if (payload.type !== 'public_customer') {
      throw new UnauthorizedException('Invalid customer session');
    }

    const customer = await this.publicCustomerAuthService.getCustomerById(
      payload.businessId,
      payload.sub,
    );

    return {
      customerId: customer.id,
      email: payload.email,
      businessId: payload.businessId,
      customer,
    };
  }
}
