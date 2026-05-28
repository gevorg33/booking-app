import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { User } from '../user/entities/user.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { TenantMemberContactService } from '../business/tenant-member-contact.service.js';
import { normalizeStoredPhone } from '../../common/utils/phone-country.util.js';

type ProfileFields = Pick<CreateEmployeeDto, 'title' | 'avatarUrl'>;

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private eventStore: EventStoreService,
    private tenantContactService: TenantMemberContactService,
  ) {}

  async create(businessId: string, dto: CreateEmployeeDto, userId?: string): Promise<Employee> {
    if (dto.email?.trim()) {
      await this.tenantContactService.assertEmailAvailableInTenant(businessId, dto.email);
    }
    const phone = this.normalizePhoneField(dto.phone);

    if (phone) {
      await this.tenantContactService.assertPhoneAvailableInTenant(businessId, phone);
    }

    const { title, avatarUrl, phone: _ignoredPhone, ...rest } = dto;
    const metadata = this.buildMetadata({}, { title, avatarUrl });

    const employee = await this.employeeRepo.save(
      this.employeeRepo.create({ ...rest, phone, businessId, metadata }),
    );
    await this.eventStore.publish({
      eventType: EventType.EMPLOYEE_CREATED,
      aggregateType: 'employee',
      aggregateId: employee.id,
      businessId,
      payload: { name: employee.name },
      userId,
    });
    return employee;
  }

  async findAll(businessId: string): Promise<Employee[]> {
    return this.employeeRepo.find({ where: { businessId, isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userId?: string): Promise<Employee> {
    const employee = await this.findOne(id);
    const exclude = {
      employeeId: employee.id,
      userId: employee.userId ?? undefined,
    };

    if (dto.email !== undefined && dto.email?.trim()) {
      await this.tenantContactService.assertEmailAvailableInTenant(
        employee.businessId,
        dto.email,
        exclude,
      );
    }
    if (dto.phone !== undefined && dto.phone?.trim()) {
      const normalizedPhone = this.normalizePhoneField(dto.phone);
      await this.tenantContactService.assertPhoneAvailableInTenant(
        employee.businessId,
        normalizedPhone,
        exclude,
      );
      dto.phone = normalizedPhone;
    }

    const { title, avatarUrl, ...rest } = dto;

    Object.assign(employee, rest);

    if (title !== undefined || avatarUrl !== undefined) {
      employee.metadata = this.buildMetadata(employee.metadata ?? {}, { title, avatarUrl });
    }

    const updated = await this.employeeRepo.save(employee);

    if (employee.userId) {
      await this.syncLinkedUserContact(employee.userId, dto);
    }

    await this.eventStore.publish({
      eventType: EventType.EMPLOYEE_UPDATED,
      aggregateType: 'employee',
      aggregateId: id,
      businessId: employee.businessId,
      payload: dto,
      userId,
    });
    return updated;
  }

  private async syncLinkedUserContact(userId: string, dto: UpdateEmployeeDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    let changed = false;

    if (dto.email !== undefined && dto.email?.trim()) {
      await this.tenantContactService.assertUserEmailGloballyAvailable(dto.email, userId);
      user.email = this.tenantContactService.normalizeEmail(dto.email);
      changed = true;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone?.trim()
        ? this.normalizePhoneField(dto.phone)
        : '';
      changed = true;
    }

    if (changed) {
      await this.userRepo.save(user);
    }
  }

  async remove(id: string, userId?: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepo.update(id, { isActive: false });
    await this.eventStore.publish({
      eventType: EventType.EMPLOYEE_UPDATED,
      aggregateType: 'employee',
      aggregateId: id,
      businessId: employee.businessId,
      payload: { isActive: false },
      userId,
    });
  }

  private buildMetadata(
    existing: Record<string, any>,
    fields: Partial<ProfileFields>,
  ): Record<string, any> {
    const metadata = { ...existing };

    if (fields.title !== undefined) {
      if (fields.title?.trim()) metadata.title = fields.title.trim();
      else delete metadata.title;
    }

    if (fields.avatarUrl !== undefined) {
      if (fields.avatarUrl?.trim()) metadata.avatarUrl = fields.avatarUrl.trim();
      else delete metadata.avatarUrl;
    }

    return metadata;
  }

  private normalizePhoneField(phone?: string): string {
    if (!phone?.trim()) {
      throw new BadRequestException('Enter a valid phone number with country code');
    }
    const normalized = normalizeStoredPhone(phone);
    if (!normalized) {
      throw new BadRequestException('Enter a valid phone number with country code');
    }
    return normalized;
  }
}
