import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiCommandService } from './ai-command.service.js';
import { AiCommandDto } from './dto/ai-command.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/ai')
@UseGuards(JwtAuthGuard)
export class AiCommandController {
  constructor(private aiCommandService: AiCommandService) {}

  @Post('command')
  execute(
    @Param('businessId') businessId: string,
    @Body() dto: AiCommandDto,
    @CurrentUser() user: any,
  ) {
    return this.aiCommandService.executeCommand(businessId, dto.prompt, user?.id, {
      history: dto.history,
      context: dto.context,
    });
  }

  @Post('command/tasks/:taskId/approve')
  approve(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiCommandService.approveTask(taskId, user?.id);
  }
}
