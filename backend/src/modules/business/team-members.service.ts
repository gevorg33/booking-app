import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMember, MemberRole } from './entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessService } from './business.service.js';
import { AssignableMemberRole } from './dto/update-member-role.dto.js';

export interface TeamMemberView {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  employeeId: string | null;
  employeeName: string | null;
}

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private businessService: BusinessService,
  ) {}

  async list(businessId: string, requesterId: string): Promise<TeamMemberView[]> {
    await this.businessService.ensureMember(businessId, requesterId);

    const members = await this.memberRepo.find({
      where: { businessId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const employeeByUserId = new Map(
      employees.filter((e) => e.userId).map((e) => [e.userId!, e]),
    );

    return members.map((member) => {
      const linked = employeeByUserId.get(member.userId);
      const user = member.user;
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
      return {
        id: member.id,
        userId: member.userId,
        email: user.email,
        name,
        role: member.role,
        employeeId: linked?.id ?? null,
        employeeName: linked?.name ?? null,
      };
    });
  }

  async updateRole(
    businessId: string,
    memberId: string,
    role: AssignableMemberRole,
    requesterId: string,
  ): Promise<TeamMemberView> {
    await this.businessService.ensureOwner(businessId, requesterId);

    const member = await this.memberRepo.findOne({
      where: { id: memberId, businessId },
      relations: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('The business owner role cannot be changed');
    }

    if (member.userId === requesterId) {
      throw new BadRequestException('You cannot change your own role');
    }

    member.role = role;
    await this.memberRepo.save(member);

    const linked = member.userId
      ? await this.employeeRepo.findOne({
          where: { businessId, userId: member.userId, isActive: true },
        })
      : null;

    const user = member.user;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

    return {
      id: member.id,
      userId: member.userId,
      email: user.email,
      name,
      role: member.role,
      employeeId: linked?.id ?? null,
      employeeName: linked?.name ?? null,
    };
  }

  async updateRoleByEmployeeId(
    businessId: string,
    employeeId: string,
    role: AssignableMemberRole,
    requesterId: string,
  ): Promise<TeamMemberView> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId, isActive: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!employee.userId) {
      throw new BadRequestException('This employee does not have dashboard access yet');
    }

    const member = await this.memberRepo.findOne({
      where: { businessId, userId: employee.userId },
    });
    if (!member) {
      throw new NotFoundException('Team member not found for this employee');
    }

    return this.updateRole(businessId, member.id, role, requesterId);
  }
}
