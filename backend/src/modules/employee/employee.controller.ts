import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service.js';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from './dto/create-employee.dto.js';
import { SendAppAccessDto } from './dto/send-app-access.dto.js';
import { UpdateMemberRoleDto } from '../business/dto/update-member-role.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { BusinessService } from '../business/business.service.js';
import { TeamMembersService } from '../business/team-members.service.js';

@Controller('businesses/:businessId/employees')
export class EmployeeController {
  constructor(
    private employeeService: EmployeeService,
    private invitationsService: InvitationsService,
    private businessService: BusinessService,
    private teamMembersService: TeamMembersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeeService.create(businessId, dto, user?.id);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.employeeService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeeService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeeService.remove(id, user?.id);
  }

  @Patch(':id/access-role')
  @UseGuards(JwtAuthGuard)
  updateAccessRole(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamMembersService.updateRoleByEmployeeId(
      businessId,
      id,
      dto.role,
      user.id,
    );
  }

  @Post(':id/send-app-access')
  @UseGuards(JwtAuthGuard)
  async sendAppAccess(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: SendAppAccessDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.invitationsService.sendEmployeeAppAccess(
      businessId,
      id,
      user.id,
      dto.role,
    );
  }
}
