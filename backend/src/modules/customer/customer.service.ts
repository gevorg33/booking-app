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

  /** Normalize phone to digits-only for lookup. */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Reuse an existing tenant customer when email and/or phone matches;
   * otherwise create a new record.
   */
  async findOrCreateByContact(
    businessId: string,
    dto: CreateCustomerDto,
  ): Promise<{ customer: Customer; created: boolean }> {
    const email = dto.email ? this.normalizeEmail(dto.email) : null;
    const phone = dto.phone ? this.normalizePhone(dto.phone) : null;

    if (email) {
      const byEmail = await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.business_id = :businessId', { businessId })
        .andWhere('customer.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(customer.email) = :email', { email })
        .getOne();
      if (byEmail) {
        if (phone && !byEmail.phone) {
          byEmail.phone = dto.phone!;
          await this.customerRepo.save(byEmail);
        }
        if (dto.name && byEmail.name !== dto.name) {
          byEmail.name = dto.name;
          await this.customerRepo.save(byEmail);
        }
        return { customer: byEmail, created: false };
      }
    }

    if (phone) {
      const customers = await this.customerRepo.find({
        where: { businessId, isActive: true },
      });
      const byPhone = customers.find(
        (c) => c.phone && this.normalizePhone(c.phone) === phone,
      );
      if (byPhone) {
        if (email && !byPhone.email) {
          byPhone.email = dto.email!;
          await this.customerRepo.save(byPhone);
        }
        if (dto.name && byPhone.name !== dto.name) {
          byPhone.name = dto.name;
          await this.customerRepo.save(byPhone);
        }
        return { customer: byPhone, created: false };
      }
    }

    const customer = await this.create(businessId, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });
    return { customer, created: true };
  }
}
