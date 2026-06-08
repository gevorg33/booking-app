import { Controller, Get, Query } from '@nestjs/common';
import {
  resolveMobileAppConfig,
  type MobileAppPlatform,
  type MobileAppSurface,
} from '../../common/utils/mobile-app-config.util.js';

@Controller('mobile-app')
export class MobileAppConfigController {
  @Get('config')
  getConfig(
    @Query('surface') surface: MobileAppSurface = 'consumer_app',
    @Query('platform') platform: MobileAppPlatform = 'web',
    @Query('version') _version?: string,
  ) {
    return resolveMobileAppConfig({ surface, platform, version: _version });
  }
}
