import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { ApplyCatalogDto, SetBusinessTypeDto } from './dto/onboarding.dto.js';

@Controller('businesses/:businessId/onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    private businessService: BusinessService,
  ) {}

  private async guard(businessId: string, userId: string) {
    await this.businessService.ensureMember(businessId, userId);
  }

  @Get('status')
  async getStatus(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.getStatus(businessId);
  }

  @Get('business-types')
  getBusinessTypes() {
    return this.onboardingService.getBusinessTypes();
  }

  @Post('business-type')
  async setBusinessType(
    @Param('businessId') businessId: string,
    @Body() dto: SetBusinessTypeDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.setBusinessType(businessId, dto);
  }

  @Post('recommend-catalog')
  async recommendCatalog(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.recommendCatalog(businessId);
  }

  @Post('apply-catalog')
  async applyCatalog(
    @Param('businessId') businessId: string,
    @Body() dto: ApplyCatalogDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.applyCatalog(businessId, dto);
  }

  @Post('apply-schedule')
  async applySchedule(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.applyDefaultSchedule(businessId, user.id);
  }

  @Get('vertical-playbook')
  async getVerticalPlaybook(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.getVerticalPlaybookPreview(businessId);
  }

  @Post('apply-playbook')
  async applyPlaybook(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.applyVerticalPlaybook(businessId, user.id);
  }

  @Post('skip-schedule')
  async skipSchedule(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.skipScheduleStep(businessId);
  }

  @Post('complete')
  async complete(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.guard(businessId, user.id);
    return this.onboardingService.completeOnboarding(businessId);
  }
}
