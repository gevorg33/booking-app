import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { StrategyEvalService } from './strategy-eval.service.js';
import { SubmitHipaaEvalDto, SubmitMarketplaceEvalDto } from './dto/submit-strategy-eval.dto.js';

@Controller('businesses/:businessId/strategy-eval')
@UseGuards(JwtAuthGuard)
export class StrategyEvalController {
  constructor(
    private strategyEvalService: StrategyEvalService,
    private businessService: BusinessService,
  ) {}

  @Get('summary')
  async getSummary(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return { summary: await this.strategyEvalService.getSummary(businessId) };
  }

  @Get('hipaa/framework')
  async getHipaaFramework(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.strategyEvalService.getHipaaFramework();
  }

  @Get('hipaa')
  async getHipaaEval(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return { evaluation: await this.strategyEvalService.getHipaaEval(businessId) };
  }

  @Put('hipaa')
  async submitHipaaEval(
    @Param('businessId') businessId: string,
    @Body() dto: SubmitHipaaEvalDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return { evaluation: await this.strategyEvalService.submitHipaaEval(businessId, dto) };
  }

  @Get('marketplace/framework')
  async getMarketplaceFramework(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.strategyEvalService.getMarketplaceFramework();
  }

  @Get('marketplace')
  async getMarketplaceEval(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return { evaluation: await this.strategyEvalService.getMarketplaceEval(businessId) };
  }

  @Put('marketplace')
  async submitMarketplaceEval(
    @Param('businessId') businessId: string,
    @Body() dto: SubmitMarketplaceEvalDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return { evaluation: await this.strategyEvalService.submitMarketplaceEval(businessId, dto) };
  }
}
