import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { BusinessInvitation } from './entities/business-invitation.entity.js';
import { BusinessMember, MemberRole } from '../business/entities/business-member.entity.js';
import { User, UserRole } from '../user/entities/user.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { EmailService } from '../notifications/email.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(BusinessInvitation) private inviteRepo: Repository<BusinessInvitation>,
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private emailService: EmailService,
  ) {}

  async list(businessId: string): Promise<BusinessInvitation[]> {
    return this.inviteRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    businessId: string,
    createdByUserId: string,
    dto: { email: string; role?: MemberRole; employeeName?: string },
  ): Promise<BusinessInvitation> {
    const email = dto.email.trim().toLowerCase();
    const existingMember = await this.userRepo.findOne({ where: { email } });
    if (existingMember) {
      const member = await this.memberRepo.findOne({
        where: { businessId, userId: existingMember.id },
      });
      if (member) throw new ConflictException('User is already a member of this business');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.inviteRepo.save(
      this.inviteRepo.create({
        businessId,
        email,
        role: dto.role ?? MemberRole.CONTRIBUTOR,
        token,
        employeeName: dto.employeeName?.trim(),
        createdByUserId,
        expiresAt,
      }),
    );

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await this.emailService.send({
      to: email,
      subject: 'You are invited to join OptiSchedule',
      html: `<p>You have been invited as a service provider.</p>
        <p><a href="${appUrl}/accept-invite?token=${token}">Accept invitation</a></p>
        <p>This link expires in 7 days.</p>`,
      text: `Accept invitation: ${appUrl}/accept-invite?token=${token}`,
    });

    return invite;
  }

  async getByToken(token: string) {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: { business: true },
    });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.acceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invitation expired');
    return {
      email: invite.email,
      businessName: invite.business.name,
      role: invite.role,
      employeeName: invite.employeeName,
    };
  }

  async accept(
    token: string,
    dto: { password: string; firstName: string; lastName: string },
  ) {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: { business: true },
    });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.acceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    let user = await this.userRepo.findOne({ where: { email: invite.email } });
    if (!user) {
      user = await this.userRepo.save(
        this.userRepo.create({
          email: invite.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.EMPLOYEE,
        }),
      );
    }

    await this.memberRepo.save(
      this.memberRepo.create({
        userId: user.id,
        businessId: invite.businessId,
        role: invite.role,
      }),
    );

    const employeeName =
      invite.employeeName || `${dto.firstName} ${dto.lastName}`.trim();
    await this.employeeRepo.save(
      this.employeeRepo.create({
        businessId: invite.businessId,
        userId: user.id,
        name: employeeName,
        email: invite.email,
      }),
    );

    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      business: {
        id: invite.business.id,
        name: invite.business.name,
        slug: invite.business.slug,
      },
    };
  }
}
