import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

type ProfileFields = Pick<CreateEmployeeDto, 'title' | 'avatarUrl'>;

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private eventStore: EventStoreService,
  ) {}

  async create(businessId: string, dto: CreateEmployeeDto, userId?: string): Promise<Employee> {
    const { title, avatarUrl, ...rest } = dto;
    const metadata = this.buildMetadata({}, { title, avatarUrl });

    const employee = await this.employeeRepo.save(
      this.employeeRepo.create({ ...rest, businessId, metadata }),
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
    const { title, avatarUrl, ...rest } = dto;

    Object.assign(employee, rest);

    if (title !== undefined || avatarUrl !== undefined) {
      employee.metadata = this.buildMetadata(employee.metadata ?? {}, { title, avatarUrl });
    }

    const updated = await this.employeeRepo.save(employee);
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
}
