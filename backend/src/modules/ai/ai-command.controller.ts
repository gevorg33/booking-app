import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Put,
  Patch,
} from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service.js';
import {
  AiSuggestionsService,
  type AiSuggestionsContext,
} from './ai-suggestions.service.js';
import { AiBriefingService } from './ai-briefing.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiAuditService } from './ai-audit.service.js';
import { AiWeeklyReportService } from './ai-weekly-report.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiEvalHarvestService } from './ai-eval-harvest.service.js';
import { AiAccuracyRatchetService } from './ai-accuracy-ratchet.service.js';
import { AiAccuracyReviewService } from './ai-accuracy-review.service.js';
import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
} from './ai-command-registry.build.js';
import { buildAiFeatureCatalog } from './ai-feature-catalog.js';
import { buildParityDashboardSnapshot } from './ai-parity-dashboard.util.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { AiAliasSuggestionService } from './ai-alias-suggestion.service.js';
import { AiCommandDto } from './dto/ai-command.dto.js';
import { AiCommandTraceFeedbackDto } from './dto/ai-command-trace-feedback.dto.js';
import { AiEvalLabelQueueUpdateDto } from './dto/ai-eval-label-queue-update.dto.js';
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
    private weeklyReportService: AiWeeklyReportService,
    private platform: AiPlatformService,
    private commandTrace: AiCommandTraceService,
    private evalHarvest: AiEvalHarvestService,
    private accuracyReview: AiAccuracyReviewService,
    private entityMemory: AiEntityMemoryService,
    private aliasSuggestions: AiAliasSuggestionService,
    private accuracyRatchet: AiAccuracyRatchetService,
  ) {}

  /** parity-4.4 — feature parity coverage snapshot for AI-ops dashboard. */
  @Get('parity/coverage')
  getParityCoverage(@Param('businessId') _businessId: string) {
    const registry = buildCommandRegistry(
      collectCompoundStepIds(buildCompoundCommandRecipes()),
    );
    const catalog = buildAiFeatureCatalog(registry);
    return buildParityDashboardSnapshot(catalog);
  }

  @Get('capabilities')
  getCapabilities(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { membershipRole?: string },
  ) {
    return this.aiGateway.getCapabilities(
      businessId,
      'dashboard',
      user?.membershipRole,
    );
  }

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

  @Get('weekly-report')
  getWeeklyReport(@Param('businessId') businessId: string) {
    return this.weeklyReportService.getWeeklyReport(businessId);
  }

  @Get('analytics')
  getCommandAnalytics(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 30))
      : 30;
    return this.platform.getCommandAnalytics(businessId, periodDays);
  }

  @Get('accuracy/worst-prompts')
  getWorstPrompts(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 30))
      : 30;
    const cappedLimit = limit
      ? Math.min(100, Math.max(5, Number(limit) || 20))
      : 20;
    return this.commandTrace.exportWorstPrompts(
      businessId,
      periodDays,
      cappedLimit,
    );
  }

  @Get('accuracy/worst-prompts/eval-export')
  exportWorstPromptsForEval(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 30))
      : 30;
    const cappedLimit = limit
      ? Math.min(100, Math.max(5, Number(limit) || 20))
      : 20;
    return this.commandTrace.exportWorstPromptsForEval(
      businessId,
      periodDays,
      cappedLimit,
    );
  }

  @Get('accuracy/confusion-matrix')
  getConfusionMatrix(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 30))
      : 30;
    const cappedLimit = limit
      ? Math.min(50, Math.max(5, Number(limit) || 25))
      : 25;
    return this.commandTrace.exportConfusionMatrix(
      businessId,
      periodDays,
      cappedLimit,
    );
  }

  @Get('accuracy/slo')
  getAccuracySlo(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(14, Number(days) || 30))
      : 30;
    return this.commandTrace.exportAccuracySlo(businessId, periodDays);
  }

  /** acc-6.1 — weekly accuracy review digest for AI Ops dashboard. */
  @Get('accuracy/review')
  getAccuracyReview(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(30, Math.max(7, Number(days) || 7))
      : 7;
    return this.accuracyReview.buildReviewDigest(businessId, periodDays);
  }

  /** acc-6.7 — escalation analytics (inverse-accuracy proxy; target < 1%). */
  @Get('accuracy/escalations')
  getEscalationAnalytics(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 7))
      : 7;
    const recentLimit = limit
      ? Math.min(25, Math.max(5, Number(limit) || 10))
      : 10;
    return this.commandTrace.exportEscalationAnalytics(
      businessId,
      periodDays,
      recentLimit,
    );
  }

  /** acc-6.8 — rolling 30-day 99% program exit gate. */
  @Get('accuracy/exit-gate')
  async getAccuracyExitGate(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(14, Number(days) || 30))
      : 30;
    const analytics = await this.commandTrace.getAccuracyAnalytics(
      businessId,
      periodDays,
    );
    return analytics.exitGate ?? { met: false, failures: ['No trace data'], criteria: [] };
  }

  /** acc-6.4/6.8 — accuracy program ladder + exit gate. */
  @Get('accuracy/program')
  getAccuracyProgram(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(14, Number(days) || 30))
      : 30;
    return this.accuracyReview.buildProgramStatus(businessId, periodDays);
  }

  /** acc-6.4 — CI accuracy floor ratchet status (platform eval baseline). */
  @Get('accuracy/ratchet')
  getAccuracyRatchet(@Param('businessId') _businessId: string) {
    return this.accuracyRatchet.getStatus();
  }

  /** acc-6.4 — apply CI floor ratchet after green eval (release workflow). */
  @Post('accuracy/ratchet/apply')
  applyAccuracyRatchet(@Param('businessId') _businessId: string) {
    return this.accuracyRatchet.applyRatchetIfEligible();
  }

  /** acc-6.1 — manually trigger weekly review publish (alert + email). */
  @Post('accuracy/review/publish')
  publishAccuracyReview(@Param('businessId') businessId: string) {
    return this.accuracyReview.publishWeeklyReviewForBusiness(businessId);
  }

  @Get('entity-memory/alias-suggestions')
  listAliasSuggestions(@Param('businessId') businessId: string) {
    return this.entityMemory.listPendingAliasSuggestions(businessId);
  }

  @Post('entity-memory/alias-suggestions/:suggestionId/approve')
  approveAliasSuggestion(
    @Param('businessId') businessId: string,
    @Param('suggestionId') suggestionId: string,
  ) {
    return this.entityMemory.approvePendingAliasSuggestion(
      businessId,
      suggestionId,
    );
  }

  /** acc-6.3 — harvest recurring entity corrections into pending alias suggestions. */
  @Post('entity-memory/alias-suggestions/harvest')
  harvestAliasSuggestions(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(90, Math.max(7, Number(days) || 30))
      : 30;
    return this.aliasSuggestions.harvestForBusiness(businessId, periodDays);
  }

  @Get('eval/label-queue')
  listEvalLabelQueue(
    @Param('businessId') businessId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const cappedLimit = limit ? Math.min(100, Math.max(5, Number(limit) || 50)) : 50;
    const queueStatus =
      status === 'labeled' ||
      status === 'dismissed' ||
      status === 'exported'
        ? status
        : 'pending';
    return this.evalHarvest.listQueue(businessId, queueStatus, cappedLimit);
  }

  @Post('eval/label-queue/harvest')
  harvestEvalLabelQueue(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    const periodDays = days
      ? Math.min(30, Math.max(1, Number(days) || 7))
      : 7;
    return this.evalHarvest.harvestBusiness(businessId, periodDays);
  }

  @Patch('eval/label-queue/:itemId')
  updateEvalLabelQueueItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AiEvalLabelQueueUpdateDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.evalHarvest.updateQueueItem(
      businessId,
      itemId,
      dto,
      user?.id,
    );
  }

  @Post('eval/label-queue/:itemId/approve')
  approveEvalLabelQueueItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.evalHarvest.approveQueueItem(businessId, itemId, user?.id);
  }

  @Post('eval/label-queue/:itemId/dismiss')
  dismissEvalLabelQueueItem(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.evalHarvest.dismissQueueItem(businessId, itemId);
  }

  @Get('eval/label-queue/export-fixtures-module')
  exportEvalFixturesModule(@Param('businessId') businessId: string) {
    return this.evalHarvest.exportFixturesModule(businessId);
  }

  /** acc-6.2 — triaged failures tracked to closure (open/applied fix tracks). */
  @Get('eval/closure-queue')
  listClosureQueue(
    @Param('businessId') businessId: string,
    @Query('fixStatus') fixStatus?: string,
    @Query('limit') limit?: string,
  ) {
    const status =
      fixStatus === 'applied' || fixStatus === 'dismissed' ? fixStatus : 'open';
    const cappedLimit = limit ? Math.min(100, Math.max(5, Number(limit) || 50)) : 50;
    return this.evalHarvest.listClosureQueue(businessId, status, cappedLimit);
  }

  @Post('trace/:traceId/feedback')
  recordTraceFeedback(
    @Param('businessId') businessId: string,
    @Param('traceId') traceId: string,
    @Body() dto: AiCommandTraceFeedbackDto,
  ) {
    return this.commandTrace.recordFeedback(traceId, businessId, dto);
  }

  @Post('trace/:traceId/abandon')
  recordTraceAbandon(
    @Param('businessId') businessId: string,
    @Param('traceId') traceId: string,
  ) {
    return this.commandTrace.markClarifyAbandoned(traceId, businessId);
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
    return this.auditService.getAuditLog(
      businessId,
      limit ? Number(limit) : 50,
    );
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
    return this.aiGateway.approveTask(
      businessId,
      taskId,
      user?.id,
      'dashboard',
    );
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
