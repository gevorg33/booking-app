import { Controller, Post, Get, Body, Param, Query, UseGuards, Put } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service.js';
import { AiSuggestionsService, type AiSuggestionsContext } from './ai-suggestions.service.js';
import { AiBriefingService } from './ai-briefing.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiAuditService } from './ai-audit.service.js';
import { AiCommandDto } from './dto/ai-command.dto.js';
import type { AiSettings } from './ai-settings.types.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/ai')
@UseGuards(JwtAuthGuard)
export class AiCommandController {
  constructor(
    private aiGateway: AiGatewayService,
    private suggestionsService: AiSuggestionsService,
    private briefingService: AiBriefingService,
    private aiSettings: AiSettingsService,
    private auditService: AiAuditService,
  ) {}

  @Get('suggestions')
  getSuggestions(
    @Param('businessId') businessId: string,
    @Query('route') route?: string,
    @Query('scheduleTab') scheduleTab?: string,
    @Query('viewMode') viewMode?: string,
  ) {
    const context: AiSuggestionsContext = {};
    if (route) context.route = route;
    if (scheduleTab) context.scheduleTab = scheduleTab;
    if (viewMode) context.viewMode = viewMode;
    return this.suggestionsService.getSuggestions(businessId, context);
  }

  @Get('briefing')
  getBriefing(@Param('businessId') businessId: string) {
    return this.briefingService.getMorningBriefing(businessId);
  }

  @Get('settings')
  getAiSettings(@Param('businessId') businessId: string) {
    return this.aiSettings.getSettings(businessId);
  }

  @Put('settings')
  updateAiSettings(
    @Param('businessId') businessId: string,
    @Body() body: Partial<AiSettings>,
  ) {
    return this.aiSettings.updateSettings(businessId, body);
  }

  @Get('audit')
  getAuditLog(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getAuditLog(businessId, limit ? Number(limit) : 50);
  }

  @Post('command')
  execute(
    @Param('businessId') businessId: string,
    @Body() dto: AiCommandDto,
    @CurrentUser() user: any,
  ) {
    return this.aiGateway.execute({
      surface: 'dashboard',
      businessId,
      prompt: dto.prompt,
      userId: user?.id,
      membershipRole: user?.membershipRole,
      employeeId: user?.employeeId,
      confirmed: dto.confirmed === true,
      history: dto.history,
      context: dto.context,
    });
  }

  @Post('command/tasks/:taskId/approve')
  approve(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiGateway.approveTask(businessId, taskId, user?.id, 'dashboard');
  }

  @Post('command/tasks/:taskId/steps/:stepId/retry')
  retryStep(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiGateway.retryFailedStep(businessId, taskId, stepId, user?.id);
  }
}
