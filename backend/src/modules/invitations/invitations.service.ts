import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { BusinessInvitation } from './entities/business-invitation.entity.js';
import { BusinessMember, MemberRole } from '../business/entities/business-member.entity.js';
import { User, UserRole } from '../user/entities/user.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { TenantMemberContactService } from '../business/tenant-member-contact.service.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import {
  inferDefaultPhoneCountryCode,
  normalizeStoredPhone,
} from '../../common/utils/phone-country.util.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(BusinessInvitation) private inviteRepo: Repository<BusinessInvitation>,
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private emailService: EmailService,
    private tenantContactService: TenantMemberContactService,
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
    dto: { email: string; role?: MemberRole; employeeName?: string; employeeId?: string },
  ): Promise<BusinessInvitation> {
    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot invite someone as business owner');
    }
    if (dto.role && dto.role !== MemberRole.CONTRIBUTOR) {
      const creator = await this.memberRepo.findOne({
        where: { businessId, userId: createdByUserId },
      });
      if (!creator || creator.role !== MemberRole.OWNER) {
        throw new ForbiddenException('Only the business owner can invite admin or manager roles');
      }
    }
    const email = dto.email.trim().toLowerCase();

    if (dto.employeeId) {
      return this.sendEmployeeAppAccess(businessId, dto.employeeId, createdByUserId);
    }

    await this.tenantContactService.assertEmailAvailableForInvite(businessId, email);

    await this.expirePendingInvites(businessId, email);

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
        employeeId: null,
        createdByUserId,
        expiresAt,
      }),
    );

    await this.sendInviteEmailOrThrow(email, token, 'invite');
    return invite;
  }

  async sendEmployeeAppAccess(
    businessId: string,
    employeeId: string,
    createdByUserId: string,
    role?: MemberRole,
  ): Promise<BusinessInvitation> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId, isActive: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    if (!employee.email?.trim()) {
      throw new BadRequestException('Add an email to this employee profile first');
    }
    if (employee.userId) {
      throw new ConflictException('This employee already has app access. They can sign in or use Forgot password.');
    }

    const email = employee.email.trim().toLowerCase();

    await this.tenantContactService.assertEmailAvailableInTenant(businessId, email, {
      employeeId: employee.id,
    });

    await this.expirePendingInvites(businessId, email, employeeId);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.inviteRepo.save(
      this.inviteRepo.create({
        businessId,
        email,
        role: role ?? MemberRole.CONTRIBUTOR,
        token,
        employeeName: employee.name,
        employeeId: employee.id,
        createdByUserId,
        expiresAt,
      }),
    );

    await this.sendInviteEmailOrThrow(email, token, 'app-access');
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
    const existingUser = await this.userRepo.findOne({ where: { email: invite.email } });
    const settings = invite.business.settings as Record<string, unknown> | undefined;
    return {
      email: invite.email,
      businessName: invite.business.name,
      role: invite.role,
      employeeName: invite.employeeName,
      isAppAccess: Boolean(invite.employeeId),
      hasExistingAccount: Boolean(existingUser),
      defaultPhoneCountryCode: inferDefaultPhoneCountryCode(settings, invite.business.timezone),
    };
  }

  async accept(token: string, dto: AcceptInvitationDto) {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: { business: true },
    });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.acceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    let user = await this.userRepo.findOne({ where: { email: invite.email } });
    if (!user) {
      if (!dto.password?.trim()) {
        throw new BadRequestException('Password is required for new accounts');
      }
      user = await this.userRepo.save(
        this.userRepo.create({
          email: invite.email,
          passwordHash: await bcrypt.hash(dto.password, 10),
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.EMPLOYEE,
        }),
      );
    } else {
      if (!user.firstName?.trim()) user.firstName = dto.firstName;
      if (!user.lastName?.trim()) user.lastName = dto.lastName;
      await this.userRepo.save(user);
    }

    const existingMember = await this.memberRepo.findOne({
      where: { userId: user.id, businessId: invite.businessId },
    });
    if (!existingMember) {
      await this.memberRepo.save(
        this.memberRepo.create({
          userId: user.id,
          businessId: invite.businessId,
          role: invite.role,
        }),
      );
    }

    let employee: Employee | null = null;
    if (invite.employeeId) {
      employee = await this.employeeRepo.findOne({
        where: { id: invite.employeeId, businessId: invite.businessId, isActive: true },
      });
    }
    if (!employee) {
      employee = await this.employeeRepo.findOne({
        where: { businessId: invite.businessId, email: invite.email, isActive: true },
      });
    }

    if (employee) {
      if (!employee.userId) {
        employee.userId = user.id;
      }
    } else {
      const employeeName =
        invite.employeeName || `${dto.firstName} ${dto.lastName}`.trim();
      employee = await this.employeeRepo.save(
        this.employeeRepo.create({
          businessId: invite.businessId,
          userId: user.id,
          name: employeeName,
          email: invite.email,
        }),
      );
    }

    if (dto.phone?.trim()) {
      const normalizedPhone = normalizeStoredPhone(dto.phone);
      if (!normalizedPhone) {
        throw new BadRequestException('Enter a valid phone number with country code');
      }
      await this.tenantContactService.assertPhoneAvailableInTenant(
        invite.businessId,
        normalizedPhone,
        { userId: user.id, employeeId: employee.id },
      );
      user.phone = normalizedPhone;
      employee.phone = normalizedPhone;
      await this.userRepo.save(user);
    }

    await this.employeeRepo.save(employee);

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

  private async expirePendingInvites(
    businessId: string,
    email: string,
    employeeId?: string,
  ): Promise<void> {
    const pending = await this.inviteRepo.find({
      where: {
        businessId,
        email,
        acceptedAt: IsNull(),
      },
    });

    const toExpire = pending.filter(
      (inv) => !employeeId || inv.employeeId === employeeId || inv.employeeId === null,
    );

    if (toExpire.length === 0) return;

    const now = new Date();
    for (const inv of toExpire) {
      inv.expiresAt = now;
      await this.inviteRepo.save(inv);
    }
  }

  private async sendInviteEmailOrThrow(
    email: string,
    token: string,
    kind: 'invite' | 'app-access',
  ): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${appUrl}/accept-invite?token=${token}`;
    const mobileHint =
      '<p>On your phone, you can also open the OptiSchedule provider app and go to Accept Invite, or use the link above in your browser.</p>';
    const subject =
      kind === 'app-access'
        ? 'Set up your OptiSchedule provider app'
        : 'You are invited to join OptiSchedule';
    const intro =
      kind === 'app-access'
        ? '<p>Your business admin invited you to the OptiSchedule provider mobile app.</p><p>Use the link below to set your password and sign in on your phone.</p>'
        : '<p>You have been invited as a service provider.</p>';

    const result = await this.emailService.send({
      to: email,
      subject,
      html: `${intro}
        <p><a href="${link}">Set up your account</a></p>
        ${mobileHint}
        <p>This link expires in 7 days.</p>
        <p>After setup, open the provider app or go to ${appUrl}/provider/login</p>`,
      text: `Set up your account: ${link}`,
    });

    if (!result.ok) {
      throw new BadRequestException(
        result.error ||
          'Email could not be sent. Check RESEND_API_KEY and that the recipient is allowed on your Resend plan.',
      );
    }
  }
}
