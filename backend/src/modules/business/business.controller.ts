import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service.js';
import { DashboardService } from './dashboard.service.js';
import { TeamMembersService } from './team-members.service.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses')
export class BusinessController {
  constructor(
    private businessService: BusinessService,
    private dashboardService: DashboardService,
    private teamMembersService: TeamMembersService,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyBusinesses(@CurrentUser() user: any) {
    return this.businessService.getUserBusinesses(user.id);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.businessService.findBySlug(slug);
  }

  @Get(':id/team-members')
  @UseGuards(JwtAuthGuard)
  listTeamMembers(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamMembersService.list(id, user.id);
  }

  @Patch(':id/team-members/:memberId/role')
  @UseGuards(JwtAuthGuard)
  updateTeamMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamMembersService.updateRole(id, memberId, dto.role, user.id);
  }

  @Get(':id/dashboard/overview')
  @UseGuards(JwtAuthGuard)
  getDashboardOverview(@Param('id') id: string) {
    return this.dashboardService.getOverview(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.businessService.update(id, data);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessProfileDto,
  ) {
    return this.businessService.updateProfile(id, dto);
  }
}
