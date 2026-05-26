import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private eventStore: EventStoreService,
  ) {}

  async create(businessId: string, dto: CreateEmployeeDto, userId?: string): Promise<Employee> {
    const employee = await this.employeeRepo.save(
      this.employeeRepo.create({ ...dto, businessId }),
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
    Object.assign(employee, dto);
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

  async remove(id: string): Promise<void> {
    await this.employeeRepo.update(id, { isActive: false });
  }
}
