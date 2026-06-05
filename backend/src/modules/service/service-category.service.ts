import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity.js';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './dto/service-category.dto.js';
import {
  applyLocalizedNamesToMetadata,
  extractLocalizedNamesFromMetadata,
} from '../../common/i18n/service-localized-names.util.js';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategory)
    private categoryRepo: Repository<ServiceCategory>,
  ) {}

  private enrichCategory(category: ServiceCategory) {
    const localizedNames = extractLocalizedNamesFromMetadata(category.metadata);
    return Object.assign(category, { localizedNames });
  }

  async findAll(businessId: string) {
    const categories = await this.categoryRepo.find({
      where: { businessId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return categories.map((category) => this.enrichCategory(category));
  }

  async findOne(id: string, businessId: string) {
    const category = await this.categoryRepo.findOne({
      where: { id, businessId },
    });
    if (!category) throw new NotFoundException('Service category not found');
    return this.enrichCategory(category);
  }

  async create(businessId: string, dto: CreateServiceCategoryDto) {
    const { localizedNames, ...rest } = dto;
    const saved = await this.categoryRepo.save(
      this.categoryRepo.create({
        businessId,
        name: rest.name,
        description: rest.description,
        sortOrder: rest.sortOrder ?? 0,
        metadata: applyLocalizedNamesToMetadata({}, localizedNames),
      }),
    );
    return this.enrichCategory(saved);
  }

  async update(id: string, businessId: string, dto: UpdateServiceCategoryDto) {
    const category = await this.categoryRepo.findOne({
      where: { id, businessId },
    });
    if (!category) throw new NotFoundException('Service category not found');

    const { localizedNames, ...rest } = dto;
    if (localizedNames !== undefined) {
      category.metadata = applyLocalizedNamesToMetadata(
        category.metadata ?? {},
        localizedNames,
      );
    }
    Object.assign(category, rest);
    const saved = await this.categoryRepo.save(category);
    return this.enrichCategory(saved);
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.categoryRepo.update({ id, businessId }, { isActive: false });
  }
}
