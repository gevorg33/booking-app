import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/entities/user.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { BusinessMember, MemberRole } from '../business/entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private jwtService: JwtService,
    private eventStore: EventStoreService,
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
      this.businessRepo.create({ name: businessName, slug }),
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
    return { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }, business: { id: business.id, name: business.name, slug: business.slug }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const membership = await this.memberRepo.findOne({ where: { userId: user.id }, relations: { business: true } });
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      business: membership ? { id: membership.business.id, name: membership.business.name, slug: membership.business.slug } : null,
      token,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }
}
