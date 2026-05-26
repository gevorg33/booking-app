import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto.js';

@Injectable()
export class CustomerService {
  constructor(@InjectRepository(Customer) private customerRepo: Repository<Customer>) {}

  async create(businessId: string, dto: CreateCustomerDto): Promise<Customer> {
    return this.customerRepo.save(this.customerRepo.create({ ...dto, businessId }));
  }

  async findAll(businessId: string): Promise<Customer[]> {
    return this.customerRepo.find({ where: { businessId, isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    await this.customerRepo.update(id, { isActive: false });
  }
}
