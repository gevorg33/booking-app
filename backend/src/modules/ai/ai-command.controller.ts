import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiCommandService } from './ai-command.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { IsString } from 'class-validator';

export class AiCommandDto {
  @IsString()
  prompt: string;
}

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
    return this.aiCommandService.executeCommand(businessId, dto.prompt, user?.id);
  }
}
