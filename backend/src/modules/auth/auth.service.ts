import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity.js';
import { Business } from '../business/entities/business.entity.js';
import {
  BusinessMember,
  MemberRole,
} from '../business/entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { EmailService } from '../notifications/email.service.js';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import {
  AuthResponse,
  BusinessAuthSummary,
  JwtPayload,
  TenantHint,
} from './auth.types.js';
import { readBusinessDateFormatSettings } from '../../common/utils/business-date-format.util.js';
import { getBusinessDefaultCurrency } from '../../common/utils/business-currency.util.js';
import {
  getBusinessDefaultLocale,
  getBusinessEnabledLocales,
} from '../../common/utils/business-locale.util.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepo: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private eventStore: EventStoreService,
    private emailService: EmailService,
    private firebase: FirebaseAdminService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
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

    const businessName = dto.businessName || `${dto.firstName}'s Business`;
    const slug =
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      user.id.slice(0, 8);

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

    const membership = await this.memberRepo.findOne({
      where: { userId: user.id, businessId: business.id },
      relations: { business: true },
    });
    const employee = await this.findLinkedEmployee(business.id, user.id);
    const summary = this.membershipToSummary(membership!, employee);
    return this.toAuthResponse(user, membership!, employee, [summary]);
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

    return this.buildAuthResponse(user, {
      businessId: dto.businessId,
      businessSlug: dto.businessSlug,
    });
  }

  async loginWithGoogle(idToken: string, hint?: TenantHint) {
    if (!this.firebase.isReady) {
      throw new BadRequestException(
        'Google sign-in is not configured on the server',
      );
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

    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException({
        message:
          'No provider account for this Google email. Ask your admin to send app access.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    return this.buildAuthResponse(user, hint);
  }

  async switchBusiness(
    userId: string,
    businessId: string,
  ): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const memberships = await this.loadMemberships(userId);
    const membership = memberships.find((m) => m.businessId === businessId);
    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }

    const summaries = await this.buildSummaries(memberships);
    const employee = await this.findLinkedEmployee(businessId, userId);
    return this.toAuthResponse(user, membership, employee, summaries);
  }

  async getMe(userId: string, activeBusinessId?: string | null) {
    const user = await this.userRepo.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const memberships = await this.loadMemberships(userId);
    const summaries = await this.buildSummaries(memberships);

    if (!activeBusinessId) {
      if (summaries.length === 1) {
        const membership = memberships[0];
        const employee = summaries[0].employee;
        return this.toAuthResponse(
          user,
          membership,
          employee,
          summaries,
          false,
        );
      }
      return {
        user: this.toPublicUser(user),
        business: null,
        employee: null,
        businesses: summaries,
        token: null,
        requiresBusinessSelection: summaries.length > 1,
      } satisfies AuthResponse;
    }

    const membership = memberships.find(
      (m) => m.businessId === activeBusinessId,
    );
    if (!membership) {
      return {
        user: this.toPublicUser(user),
        business: null,
        employee: null,
        businesses: summaries,
        token: null,
        requiresBusinessSelection: summaries.length > 0,
      } satisfies AuthResponse;
    }

    const summary = summaries.find((s) => s.id === activeBusinessId);
    return {
      user: this.toPublicUser(user),
      business: summary
        ? {
            id: summary.id,
            name: summary.name,
            slug: summary.slug,
            locale: summary.locale,
            defaultLocale: summary.defaultLocale,
            enabledLocales: summary.enabledLocales,
            dateFormat: summary.dateFormat,
            timeFormat: summary.timeFormat,
            currency: summary.currency,
            membershipRole: summary.membershipRole,
          }
        : null,
      employee: summary?.employee ?? null,
      businesses: summaries,
      token: null,
      requiresBusinessSelection: false,
    } satisfies AuthResponse;
  }

  private async buildAuthResponse(
    user: User,
    hint?: TenantHint,
  ): Promise<AuthResponse> {
    const memberships = await this.loadMemberships(user.id);
    const summaries = await this.buildSummaries(memberships);

    if (memberships.length === 0) {
      return {
        user: this.toPublicUser(user),
        business: null,
        employee: null,
        businesses: [],
        token: this.signToken(user, null),
        requiresBusinessSelection: false,
      };
    }

    if (memberships.length === 1) {
      const employee = summaries[0].employee;
      return this.toAuthResponse(user, memberships[0], employee, summaries);
    }

    const selected = await this.resolveMembership(memberships, hint);
    if (!selected) {
      return {
        user: this.toPublicUser(user),
        business: null,
        employee: null,
        businesses: summaries,
        token: null,
        requiresBusinessSelection: true,
      };
    }

    const summary = summaries.find((s) => s.id === selected.businessId)!;
    return this.toAuthResponse(user, selected, summary.employee, summaries);
  }

  private async resolveMembership(
    memberships: BusinessMember[],
    hint?: TenantHint,
  ): Promise<BusinessMember | null> {
    if (!hint?.businessId && !hint?.businessSlug) {
      return null;
    }

    if (hint.businessId) {
      const match = memberships.find((m) => m.businessId === hint.businessId);
      if (!match) {
        throw new ForbiddenException('You do not have access to this business');
      }
      return match;
    }

    const slug = hint.businessSlug!.trim().toLowerCase();
    const match = memberships.find(
      (m) => m.business.slug.toLowerCase() === slug,
    );
    if (!match) {
      throw new ForbiddenException('You do not have access to this business');
    }
    return match;
  }

  private async loadMemberships(userId: string): Promise<BusinessMember[]> {
    return this.memberRepo.find({
      where: { userId },
      relations: { business: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async buildSummaries(
    memberships: BusinessMember[],
  ): Promise<BusinessAuthSummary[]> {
    const summaries: BusinessAuthSummary[] = [];
    for (const membership of memberships) {
      const employee = await this.findLinkedEmployee(
        membership.businessId,
        membership.userId,
      );
      summaries.push(this.membershipToSummary(membership, employee));
    }
    return summaries;
  }

  private businessLocaleFields(settings?: Record<string, unknown>) {
    const defaultLocale = getBusinessDefaultLocale(settings);
    const { dateFormat, timeFormat } = readBusinessDateFormatSettings(settings);
    return {
      locale: defaultLocale,
      defaultLocale,
      enabledLocales: getBusinessEnabledLocales(settings),
      dateFormat,
      timeFormat,
      currency: getBusinessDefaultCurrency(settings),
    };
  }

  private membershipToSummary(
    membership: BusinessMember,
    employee: { id: string; name: string } | null,
  ): BusinessAuthSummary {
    const localeFields = this.businessLocaleFields(
      membership.business.settings as Record<string, unknown> | undefined,
    );
    return {
      id: membership.business.id,
      name: membership.business.name,
      slug: membership.business.slug,
      ...localeFields,
      membershipRole: membership.role,
      employee,
    };
  }

  private toAuthResponse(
    user: User,
    membership: BusinessMember,
    employee: { id: string; name: string } | null,
    summaries: BusinessAuthSummary[],
    issueToken = true,
  ): AuthResponse {
    return {
      user: this.toPublicUser(user),
      business: {
        id: membership.business.id,
        name: membership.business.name,
        slug: membership.business.slug,
        ...this.businessLocaleFields(
          membership.business.settings as Record<string, unknown> | undefined,
        ),
        membershipRole: membership.role,
      },
      employee,
      businesses: summaries,
      token: issueToken
        ? this.signToken(user, membership, employee?.id ?? null)
        : null,
      requiresBusinessSelection: false,
    };
  }

  private signToken(
    user: User,
    membership: BusinessMember | null,
    employeeId?: string | null,
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    if (membership) {
      payload.businessId = membership.businessId;
      payload.membershipRole = membership.role;
      payload.employeeId = employeeId ?? null;
    }
    return this.jwtService.sign(payload);
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
    const user = await this.userRepo.findOne({
      where: { email: normalized, isActive: true },
    });
    if (!user) {
      return {
        ok: true,
        message: 'If an account exists, a reset link was sent.',
      };
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

    return {
      ok: true,
      message: 'If an account exists, a reset link was sent.',
    };
  }

  async getResetPasswordInfo(token: string) {
    const reset = await this.resetTokenRepo.findOne({ where: { token } });
    if (!reset || reset.usedAt)
      throw new NotFoundException('Reset link not found');
    if (reset.expiresAt < new Date())
      throw new BadRequestException('Reset link expired');

    const user = await this.userRepo.findOne({
      where: { id: reset.userId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return { email: user.email };
  }

  async resetPassword(token: string, password: string) {
    const reset = await this.resetTokenRepo.findOne({ where: { token } });
    if (!reset || reset.usedAt)
      throw new NotFoundException('Reset link not found');
    if (reset.expiresAt < new Date())
      throw new BadRequestException('Reset link expired');

    const user = await this.userRepo.findOne({
      where: { id: reset.userId, isActive: true },
    });
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
