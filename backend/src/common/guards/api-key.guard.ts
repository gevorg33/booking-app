import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../modules/integrations/api-key.service.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'] as string | undefined;
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined;

    let token: string | undefined;
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7);
    } else if (apiKeyHeader) {
      token = apiKeyHeader;
    }

    if (!token?.startsWith('osk_live_')) {
      throw new UnauthorizedException('Valid API key required');
    }

    const key = await this.apiKeyService.validateKey(token);
    if (!key) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    request.apiKey = key;
    request.apiKeyBusinessId = key.businessId;
    return true;
  }
}
