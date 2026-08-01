import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PublicCustomerJwtPayload } from './public-customer-auth.types.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { readPublicRouteSlug } from './public-customer-tenant.util.js';

type PublicCustomerAuthRequest = {
  params?: Record<string, string | undefined>;
};

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
      passReqToCallback: true,
    });
  }

  async validate(
    req: PublicCustomerAuthRequest,
    payload: PublicCustomerJwtPayload,
  ) {
    if (payload.type !== 'public_customer') {
      throw new UnauthorizedException('Invalid customer session');
    }

    // e2e-bug.218 — reject token(A) on /public/{B}/… before attaching req.user
    const slug = readPublicRouteSlug(req?.params);
    const businessId =
      await this.publicCustomerAuthService.assertSessionMatchesSlug(
        slug,
        payload.businessId,
      );

    const customer = await this.publicCustomerAuthService.getCustomerById(
      businessId,
      payload.sub,
    );

    return {
      customerId: customer.id,
      email: payload.email,
      businessId,
      customer,
    };
  }
}
