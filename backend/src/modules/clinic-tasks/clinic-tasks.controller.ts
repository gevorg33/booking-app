import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  AssignClinicTaskDto,
  CompleteClinicTaskDto,
  CreateClinicTaskDto,
  ListClinicTasksQueryDto,
  UpdateClinicTaskDto,
} from './dto/clinic-task.dto.js';
import { ClinicTasksService } from './clinic-tasks.service.js';

@Controller('businesses/:businessId/clinic-tasks')
@UseGuards(JwtAuthGuard)
export class ClinicTasksController {
  constructor(private readonly clinicTasksService: ClinicTasksService) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListClinicTasksQueryDto,
  ) {
    return {
      data: await this.clinicTasksService.listClinicTasks(
        businessId,
        user.id,
        query,
      ),
    };
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateClinicTaskDto,
  ) {
    return {
      data: await this.clinicTasksService.createClinicTask(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Post('sync-auto')
  async syncAuto(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.clinicTasksService.syncAutoTasks(businessId, user.id),
    };
  }

  @Post(':taskId/complete')
  async complete(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteClinicTaskDto,
  ) {
    return {
      data: await this.clinicTasksService.completeClinicTask(
        businessId,
        user.id,
        taskId,
        dto,
      ),
    };
  }

  @Post(':taskId/cancel')
  async cancel(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.clinicTasksService.cancelClinicTask(
        businessId,
        user.id,
        taskId,
      ),
    };
  }

  @Post(':taskId/assign')
  async assign(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AssignClinicTaskDto,
  ) {
    return {
      data: await this.clinicTasksService.assignClinicTask(
        businessId,
        user.id,
        taskId,
        dto,
      ),
    };
  }

  @Get(':taskId')
  async getOne(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.clinicTasksService.getClinicTask(
        businessId,
        user.id,
        taskId,
      ),
    };
  }

  @Put(':taskId')
  async update(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateClinicTaskDto,
  ) {
    return {
      data: await this.clinicTasksService.updateClinicTask(
        businessId,
        user.id,
        taskId,
        dto,
      ),
    };
  }
}
