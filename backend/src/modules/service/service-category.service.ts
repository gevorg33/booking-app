import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity.js';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './dto/service-category.dto.js';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategory) private categoryRepo: Repository<ServiceCategory>,
  ) {}

  async findAll(businessId: string): Promise<ServiceCategory[]> {
    return this.categoryRepo.find({
      where: { businessId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string, businessId: string): Promise<ServiceCategory> {
    const category = await this.categoryRepo.findOne({ where: { id, businessId } });
    if (!category) throw new NotFoundException('Service category not found');
    return category;
  }

  async create(businessId: string, dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    return this.categoryRepo.save(
      this.categoryRepo.create({
        businessId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
  }

  async update(
    id: string,
    businessId: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    const category = await this.findOne(id, businessId);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.categoryRepo.update({ id, businessId }, { isActive: false });
  }
}
