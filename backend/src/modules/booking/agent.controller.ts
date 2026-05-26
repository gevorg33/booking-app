import { Controller, Post, Get, Param, Body, UseGuards, Put } from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import { AgentIntentDto } from './dto/agent-intent.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private agentOrchestrator: AgentOrchestratorService) {}

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
          ? { start: new Date(dto.dateRange.start), end: new Date(dto.dateRange.end) }
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

  @Get('tasks/:taskId')
  getTask(@Param('taskId') taskId: string) {
    return this.agentOrchestrator.getTask(taskId);
  }

  @Put('tasks/:taskId/approve')
  approveTask(@Param('taskId') taskId: string, @CurrentUser() user: any) {
    return this.agentOrchestrator.approveAndExecute(taskId, user.id);
  }
}
