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
import { AiCommandTraceService } from '../ai/ai-command-trace.service.js';
import { AgentIntentDto } from './dto/agent-intent.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    private agentOrchestrator: AgentOrchestratorService,
    private agentTaskUndo: AgentTaskUndoService,
    private commandTrace: AiCommandTraceService,
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
  async undoLatest(
    @Param('businessId') businessId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.agentTaskUndo.undoLatest(businessId, user.id);
    void this.commandTrace.markWrongExecutionFromUndo({
      businessId,
      userId: user.id,
      traceId: result.commandTraceId,
      anchorTime: result.executedAt,
    });
    return result;
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
  async rebookAll(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    const workspace = await this.agentOrchestrator.previewTaskWorkspace(taskId);
    const proposals = (workspace as any)?.cancellationRecovery?.proposals ?? [];
    const task = await this.agentOrchestrator.getTask(taskId);

    const steps = proposals
      .filter((p: any) => p.recommendedCustomer && p.params)
      .map((p: any, index: number) => ({
        id: crypto.randomUUID(),
        action: 'execute_reassignment',
        description: `Rebook ${p.recommendedCustomer.customerName}`,
        params: {
          ...p.params,
          businessId,
          userId: user.id,
          proposalId: p.id,
        },
        dependsOn: index === 0 ? [] : [`rebook-${index - 1}`],
        estimatedImpact: 'Creates replacement booking',
      }));

    if (!steps.length) {
      return { success: false, message: 'No rebooking proposals available' };
    }

    for (let i = 1; i < steps.length; i++) {
      steps[i].dependsOn = [steps[i - 1].id];
    }

    const plan = {
      ...task.plan,
      id: crypto.randomUUID(),
      intent: `Rebook all from task ${taskId}`,
      steps,
      status: 'validated',
    };

    return this.agentOrchestrator.processPlan({
      plan: plan as any,
      businessId,
      userId: user.id,
      autoExecute: true,
    });
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
