import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PublicCustomerAuthGuard extends AuthGuard('public-customer-jwt') {}
