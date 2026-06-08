import { Module } from '@nestjs/common';
import { MobileAppConfigController } from './mobile-app-config.controller.js';

@Module({
  controllers: [MobileAppConfigController],
})
export class MobileAppModule {}
