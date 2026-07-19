import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import { AgentTaskUndoService } from '../../engine/agent/agent-task-undo.service.js';
import { AgentIntentDto } from './dto/agent-intent.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    private agentOrchestrator: AgentOrchestratorService,
    private agentTaskUndo: AgentTaskUndoService,
  ) {}

  @Post('intent')
  processIntent(
    @Param('businessId') businessId: string,
    @Body() dto: AgentIntentDto,
    @CurrentUser() user: any,
  ) {
    return this.agentOrchestrator.processIntent({
      agentType: dto.agentType,
      businessId,
      intent: dto.intent,
      context: {
        businessId,
        dateRange: dto.dateRange
          ? {
              start: new Date(dto.dateRange.start),
              end: new Date(dto.dateRange.end),
            }
          : undefined,
      },
      userId: user.id,
      autoExecute: dto.autoExecute,
    });
  }

  @Get('tasks')
  getTasks(@Param('businessId') businessId: string) {
    return this.agentOrchestrator.getTasks(businessId);
  }

  @Get('tasks/undo-latest/preview')
  previewUndoLatest(@Param('businessId') businessId: string) {
    return this.agentTaskUndo.getLatestUndoPreview(businessId);
  }

  @Post('tasks/undo-latest')
  undoLatest(
    @Param('businessId') businessId: string,
    @CurrentUser() user: any,
  ) {
    return this.agentTaskUndo.undoLatest(businessId, user.id);
  }

  @Get('tasks/pending')
  getPendingTasks(@Param('businessId') businessId: string) {
    return this.agentOrchestrator.getPendingTasks(businessId);
  }

  @Get('tasks/:taskId/preview')
  previewTask(@Param('taskId') taskId: string) {
    return this.agentOrchestrator.previewTaskWorkspace(taskId);
  }

  @Post('tasks/:taskId/rebook-all')
  rebookAll(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.agentOrchestrator.rebookAllFromTask(
      businessId,
      taskId,
      user.id,
    );
  }

  @Get('tasks/:taskId')
  getTask(@Param('taskId') taskId: string) {
    return this.agentOrchestrator.getTask(taskId);
  }

  @Put('tasks/:taskId/approve')
  approveTask(@Param('taskId') taskId: string, @CurrentUser() user: any) {
    return this.agentOrchestrator.approveAndExecute(taskId, user.id);
  }
}
