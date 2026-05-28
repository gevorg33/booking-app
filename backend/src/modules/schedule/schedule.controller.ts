import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';
import { TemplateApplyService } from './services/template-apply.service.js';
import { BlockScheduleService } from './services/block-schedule.service.js';
import {
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
  AssignScheduleDto,
  CreateOverrideDto,
  ApplyTemplateDto,
  DeleteTemplatesDto,
  GetTemplatesQueryDto,
  CreateDirectScheduleDto,
} from './dto/create-schedule.dto.js';
import { CreateBlockScheduleDto, UpdateBlockScheduleDto } from './dto/block-schedule.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/schedules')
export class ScheduleController {
  constructor(
    private scheduleService: ScheduleService,
    private templateApplyService: TemplateApplyService,
    private blockScheduleService: BlockScheduleService,
  ) {}

  // ─── Templates ────────────────────────────────────────────

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  createTemplate(
    @Param('businessId') businessId: string,
    @Body() dto: CreateScheduleTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.createTemplate(businessId, dto, user?.id);
  }

  @Get('templates')
  getTemplates(
    @Param('businessId') businessId: string,
    @Query() query: GetTemplatesQueryDto,
  ) {
    return this.scheduleService.getTemplates(businessId, query);
  }

  @Get('templates/:templateId')
  getTemplate(
    @Param('businessId') businessId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.scheduleService.getTemplateById(businessId, templateId);
  }

  @Put('templates/:templateId')
  @UseGuards(JwtAuthGuard)
  updateTemplate(
    @Param('businessId') businessId: string,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateScheduleTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.updateTemplate(businessId, templateId, dto, user?.id);
  }

  @Post('templates/:templateId/duplicate')
  @UseGuards(JwtAuthGuard)
  duplicateTemplate(
    @Param('businessId') businessId: string,
    @Param('templateId') templateId: string,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.duplicateTemplate(businessId, templateId, user?.id);
  }

  @Delete('templates')
  @UseGuards(JwtAuthGuard)
  deleteTemplates(
    @Param('businessId') businessId: string,
    @Body() dto: DeleteTemplatesDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.deleteTemplates(businessId, dto, user?.id);
  }

  // ─── Template Application ───────────────────────────────

  @Post('templates/apply')
  @UseGuards(JwtAuthGuard)
  applyTemplate(
    @Param('businessId') businessId: string,
    @Body() dto: ApplyTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.templateApplyService.applyTemplate(dto, businessId, user?.id);
  }

  // ─── Direct Schedule Creation (no template) ───────────────

  @Post('direct')
  @UseGuards(JwtAuthGuard)
  createDirectSchedule(
    @Param('businessId') businessId: string,
    @Body() dto: CreateDirectScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.createDirectSchedule(businessId, dto, user?.id);
  }

  // ─── Block Schedules ──────────────────────────────────────

  @Get('block-schedules')
  @UseGuards(JwtAuthGuard)
  listBlockSchedules(
    @Param('businessId') businessId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.blockScheduleService.list(businessId, employeeId);
  }

  @Get('block-schedules/:id')
  @UseGuards(JwtAuthGuard)
  getBlockSchedule(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.blockScheduleService.getOne(businessId, id);
  }

  @Post('block-schedules')
  @UseGuards(JwtAuthGuard)
  createBlockSchedule(
    @Param('businessId') businessId: string,
    @Body() dto: CreateBlockScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.blockScheduleService.create(businessId, dto, user?.id);
  }

  @Put('block-schedules/:id')
  @UseGuards(JwtAuthGuard)
  updateBlockSchedule(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBlockScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.blockScheduleService.update(businessId, id, dto, user?.id);
  }

  @Delete('block-schedules/:id')
  @UseGuards(JwtAuthGuard)
  deleteBlockSchedule(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.blockScheduleService.remove(businessId, id, user?.id);
  }

  // ─── Provider Calendar ────────────────────────────────────

  @Get('provider-calendar')
  getProviderCalendar(
    @Param('businessId') businessId: string,
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.scheduleService.getProviderCalendar(businessId, employeeId, startDate, endDate);
  }

  // ─── Slot Availability ────────────────────────────────────

  @Get('slots')
  getAvailableSlots(
    @Param('businessId') businessId: string,
    @Query('date') date: string,
    @Query('employeeId') employeeId?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.templateApplyService.getAvailableSlots(
      businessId,
      new Date(date),
      employeeId,
      serviceId,
    );
  }

  // ─── Assignments ──────────────────────────────────────────

  @Post('assignments')
  @UseGuards(JwtAuthGuard)
  assignSchedule(
    @Param('businessId') businessId: string,
    @Body() dto: AssignScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.assignSchedule(businessId, dto, user?.id);
  }

  @Get('assignments/:employeeId')
  getAssignments(@Param('employeeId') employeeId: string) {
    return this.scheduleService.getAssignments(employeeId);
  }

  // ─── Overrides ────────────────────────────────────────────

  @Post('overrides')
  @UseGuards(JwtAuthGuard)
  createOverride(
    @Param('businessId') businessId: string,
    @Body() dto: CreateOverrideDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleService.createOverride(businessId, dto, user?.id);
  }

  @Get('overrides')
  getOverrides(
    @Param('businessId') businessId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.scheduleService.getOverrides(businessId, employeeId);
  }
}
