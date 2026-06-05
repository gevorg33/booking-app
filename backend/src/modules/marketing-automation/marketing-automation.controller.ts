import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { UpdateMarketingAutomationSettingsDto } from './dto/update-marketing-automation-settings.dto.js';

@Controller('businesses/:businessId/marketing-automation')
@UseGuards(JwtAuthGuard)
export class MarketingAutomationController {
  constructor(
    private marketingAutomationService: MarketingAutomationService,
    private businessService: BusinessService,
  ) {}

  @Get('settings')
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return {
      settings: await this.marketingAutomationService.getSettings(businessId),
    };
  }

  @Put('settings')
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateMarketingAutomationSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return {
      settings: await this.marketingAutomationService.updateSettings(
        businessId,
        dto,
      ),
    };
  }

  @Get('summary')
  async getSummary(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.marketingAutomationService.getSummary(businessId);
  }

  private async ensureMember(businessId: string, userId: string) {
    const businesses = await this.businessService.getUserBusinesses(userId);
    if (!businesses.some((b) => b.id === businessId)) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}
