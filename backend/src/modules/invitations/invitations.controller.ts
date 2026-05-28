import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

@Controller('businesses/:businessId/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(
    private invitationsService: InvitationsService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async list(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.invitationsService.list(businessId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: { email: string; role?: MemberRole; employeeName?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.invitationsService.create(businessId, user.id, dto);
  }
}

@Controller('invitations')
export class PublicInvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Get(':token')
  getInvite(@Param('token') token: string) {
    return this.invitationsService.getByToken(token);
  }

  @Post(':token/accept')
  accept(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(token, dto);
  }
}
