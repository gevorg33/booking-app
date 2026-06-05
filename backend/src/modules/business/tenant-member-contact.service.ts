import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMember } from './entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { User } from '../user/entities/user.entity.js';
import { phoneDigits } from '../../common/utils/phone-country.util.js';

export interface TenantContactExclude {
  userId?: string;
  employeeId?: string;
}

@Injectable()
export class TenantMemberContactService {
  constructor(
    @InjectRepository(BusinessMember)
    private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizePhone(phone: string): string {
    return phoneDigits(phone);
  }

  /** Block invite when email already belongs to a workspace member (not a customer). */
  async assertEmailAvailableForInvite(
    businessId: string,
    email: string,
  ): Promise<void> {
    const normalized = this.normalizeEmail(email);

    const user = await this.userRepo.findOne({ where: { email: normalized } });
    if (user) {
      const member = await this.memberRepo.findOne({
        where: { businessId, userId: user.id },
      });
      if (member) {
        throw new ConflictException(
          'This email already belongs to a team member in this business',
        );
      }
    }

    const employeesWithEmail = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.business_id = :businessId', { businessId })
      .andWhere('employee.is_active = true')
      .andWhere('LOWER(TRIM(employee.email)) = :email', { email: normalized })
      .getMany();

    if (employeesWithEmail.length > 1) {
      throw new ConflictException(
        'This email is already used by another team member in this business',
      );
    }

    if (employeesWithEmail.length === 1 && employeesWithEmail[0].userId) {
      const linkedMember = await this.memberRepo.findOne({
        where: { businessId, userId: employeesWithEmail[0].userId },
      });
      if (linkedMember) {
        throw new ConflictException(
          'This email already belongs to a team member in this business',
        );
      }
    }
  }

  async assertEmailAvailableInTenant(
    businessId: string,
    email: string,
    exclude?: TenantContactExclude,
  ): Promise<void> {
    const normalized = this.normalizeEmail(email);

    const members = await this.memberRepo.find({
      where: { businessId },
      relations: { user: true },
    });
    for (const member of members) {
      if (exclude?.userId && member.userId === exclude.userId) continue;
      if (
        member.user?.email &&
        this.normalizeEmail(member.user.email) === normalized
      ) {
        throw new ConflictException(
          'This email is already used by another team member in this business',
        );
      }
    }

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    for (const employee of employees) {
      if (exclude?.employeeId && employee.id === exclude.employeeId) continue;
      if (
        employee.email &&
        this.normalizeEmail(employee.email) === normalized
      ) {
        throw new ConflictException(
          'This email is already used by another team member in this business',
        );
      }
    }
  }

  async assertPhoneAvailableInTenant(
    businessId: string,
    phone: string,
    exclude?: TenantContactExclude,
  ): Promise<void> {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return;

    const members = await this.memberRepo.find({
      where: { businessId },
      relations: { user: true },
    });
    for (const member of members) {
      if (exclude?.userId && member.userId === exclude.userId) continue;
      if (
        member.user?.phone &&
        this.normalizePhone(member.user.phone) === normalized
      ) {
        throw new ConflictException(
          'This phone number is already used by another team member in this business',
        );
      }
    }

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    for (const employee of employees) {
      if (exclude?.employeeId && employee.id === exclude.employeeId) continue;
      if (
        employee.phone &&
        this.normalizePhone(employee.phone) === normalized
      ) {
        throw new ConflictException(
          'This phone number is already used by another team member in this business',
        );
      }
    }
  }

  /** Login email is global; call after tenant-scoped check when updating a linked user. */
  async assertUserEmailGloballyAvailable(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const normalized = this.normalizeEmail(email);
    const existing = await this.userRepo.findOne({
      where: { email: normalized },
    });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException(
        'This email is already registered to another account',
      );
    }
  }
}
