import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { EnterpriseTrustService } from './enterprise-trust.service.js';
import { UpdateEnterpriseTrustSettingsDto } from './dto/update-enterprise-trust-settings.dto.js';

@Controller('businesses/:businessId/enterprise-trust')
@UseGuards(JwtAuthGuard)
export class EnterpriseTrustController {
  constructor(
    private enterpriseTrustService: EnterpriseTrustService,
    private businessService: BusinessService,
  ) {}

  @Get('settings')
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      settings: await this.enterpriseTrustService.getSettings(businessId),
    };
  }

  @Put('settings')
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateEnterpriseTrustSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      settings: await this.enterpriseTrustService.updateSettings(
        businessId,
        dto,
      ),
    };
  }

  @Get('documents')
  async getDocuments(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      documents: await this.enterpriseTrustService.renderDocuments(businessId),
    };
  }

  @Get('security-one-pager')
  async getSecurityOnePager(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.enterpriseTrustService.getSecurityOnePager();
  }
}
