import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity.js';

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expense) private expenseRepo: Repository<Expense>) {}

  async list(businessId: string, locationId?: string): Promise<Expense[]> {
    const where: Record<string, unknown> = { businessId };
    if (locationId) where.locationId = locationId;
    return this.expenseRepo.find({
      where: where as any,
      order: { expenseDate: 'DESC' },
      take: 500,
    });
  }

  async create(businessId: string, dto: Partial<Expense>): Promise<Expense> {
    return this.expenseRepo.save(
      this.expenseRepo.create({
        businessId,
        category: dto.category!,
        description: dto.description,
        amount: dto.amount ?? 0,
        currency: dto.currency || 'USD',
        expenseDate: dto.expenseDate!,
        locationId: dto.locationId || undefined,
      }),
    );
  }

  async remove(id: string, businessId: string): Promise<void> {
    const expense = await this.expenseRepo.findOne({ where: { id, businessId } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.expenseRepo.remove(expense);
  }
}
