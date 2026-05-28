import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { BusinessMember, MemberRole } from '../business/entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { EmailService } from '../notifications/email.service.js';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(PasswordResetToken) private resetTokenRepo: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private eventStore: EventStoreService,
    private emailService: EmailService,
    private firebase: FirebaseAdminService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.OWNER,
      }),
    );

    // Every user gets a business (individuals = business with single employee)
    const businessName = dto.businessName || `${dto.firstName}'s Business`;
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + user.id.slice(0, 8);

    const business = await this.businessRepo.save(
      this.businessRepo.create({
        name: businessName,
        slug,
        settings: {
          onboarding: { completed: false },
        },
      }),
    );

    await this.memberRepo.save(
      this.memberRepo.create({
        userId: user.id,
        businessId: business.id,
        role: MemberRole.OWNER,
      }),
    );

    // Create the owner as an employee too
    await this.employeeRepo.save(
      this.employeeRepo.create({
        businessId: business.id,
        userId: user.id,
        name: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
      }),
    );

    await this.eventStore.publish({
      eventType: EventType.BUSINESS_CREATED,
      aggregateType: 'business',
      aggregateId: business.id,
      businessId: business.id,
      payload: { name: businessName, ownerId: user.id },
      userId: user.id,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      user: this.toPublicUser(user),
      business: { id: business.id, name: business.name, slug: business.slug, membershipRole: MemberRole.OWNER },
      employee: await this.findLinkedEmployee(business.id, user.id),
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException({
        message: 'No account found with this email',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        message: 'Incorrect password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    return this.buildAuthResponse(user);
  }

  async loginWithGoogle(idToken: string) {
    if (!this.firebase.isReady) {
      throw new BadRequestException('Google sign-in is not configured on the server');
    }

    let decoded;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException({
        message: 'Invalid Google sign-in token',
        code: 'INVALID_GOOGLE_TOKEN',
      });
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException({
        message: 'Google account has no email',
        code: 'GOOGLE_NO_EMAIL',
      });
    }

    const user = await this.userRepo.findOne({ where: { email, isActive: true } });
    if (!user) {
      throw new UnauthorizedException({
        message: 'No provider account for this Google email. Ask your admin to send app access.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const membership = await this.memberRepo.findOne({ where: { userId: user.id }, relations: { business: true } });
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      user: this.toPublicUser(user),
      business: membership
        ? {
            id: membership.business.id,
            name: membership.business.name,
            slug: membership.business.slug,
            locale: membership.business.settings?.locale || 'en',
            membershipRole: membership.role,
          }
        : null,
      employee: membership ? await this.findLinkedEmployee(membership.business.id, user.id) : null,
      token,
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new UnauthorizedException('User not found');
    const membership = await this.memberRepo.findOne({
      where: { userId },
      relations: { business: true },
    });
    return {
      user: this.toPublicUser(user),
      business: membership
        ? {
            id: membership.business.id,
            name: membership.business.name,
            slug: membership.business.slug,
            locale: membership.business.settings?.locale || 'en',
            membershipRole: membership.role,
          }
        : null,
      employee: membership ? await this.findLinkedEmployee(membership.business.id, user.id) : null,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (dto.locale) user.locale = dto.locale;
    await this.userRepo.save(user);
    return { user: this.toPublicUser(user) };
  }

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email: normalized, isActive: true } });
    if (!user) {
      return { ok: true, message: 'If an account exists, a reset link was sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({
        userId: user.id,
        token,
        expiresAt,
        usedAt: null,
      }),
    );

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${appUrl}/set-password?token=${token}`;
    await this.emailService.send({
      to: normalized,
      subject: 'Reset your OptiSchedule password',
      html: `<p>We received a request to reset your password for the provider app.</p>
        <p><a href="${link}">Set a new password</a></p>
        <p>This link expires in 24 hours. If you did not request this, you can ignore this email.</p>
        <p>After resetting, sign in at ${appUrl}/provider/login</p>`,
      text: `Set a new password: ${link}`,
    });

    return { ok: true, message: 'If an account exists, a reset link was sent.' };
  }

  async getResetPasswordInfo(token: string) {
    const reset = await this.resetTokenRepo.findOne({ where: { token } });
    if (!reset || reset.usedAt) throw new NotFoundException('Reset link not found');
    if (reset.expiresAt < new Date()) throw new BadRequestException('Reset link expired');

    const user = await this.userRepo.findOne({ where: { id: reset.userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    return { email: user.email };
  }

  async resetPassword(token: string, password: string) {
    const reset = await this.resetTokenRepo.findOne({ where: { token } });
    if (!reset || reset.usedAt) throw new NotFoundException('Reset link not found');
    if (reset.expiresAt < new Date()) throw new BadRequestException('Reset link expired');

    const user = await this.userRepo.findOne({ where: { id: reset.userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    user.passwordHash = await bcrypt.hash(password, 10);
    await this.userRepo.save(user);

    reset.usedAt = new Date();
    await this.resetTokenRepo.save(reset);

    return { ok: true };
  }

  private async findLinkedEmployee(businessId: string, userId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });
    if (!employee) return null;
    return { id: employee.id, name: employee.name };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      locale: user.locale || 'en',
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }
}
