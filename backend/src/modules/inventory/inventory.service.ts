import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ServiceProduct } from './entities/inventory.entity.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ServiceProduct) private linkRepo: Repository<ServiceProduct>,
  ) {}

  async listProducts(businessId: string, locationId?: string): Promise<Product[]> {
    const where: Record<string, unknown> = { businessId, isActive: true };
    if (locationId) where.locationId = locationId;
    return this.productRepo.find({ where: where as any, order: { name: 'ASC' } });
  }

  async createProduct(businessId: string, dto: Partial<Product>): Promise<Product> {
    return this.productRepo.save(
      this.productRepo.create({
        businessId,
        name: dto.name!,
        sku: dto.sku,
        unitCost: dto.unitCost ?? 0,
        quantityOnHand: dto.quantityOnHand ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        locationId: dto.locationId || undefined,
      }),
    );
  }

  async linkToService(serviceId: string, productId: string, quantityPerService = 1) {
    return this.linkRepo.save(
      this.linkRepo.create({ serviceId, productId, quantityPerService }),
    );
  }

  async deductForService(serviceId: string): Promise<void> {
    const links = await this.linkRepo.find({
      where: { serviceId },
      relations: { product: true },
    });
    for (const link of links) {
      const product = link.product;
      if (!product) continue;
      product.quantityOnHand = Math.max(
        0,
        product.quantityOnHand - Math.ceil(Number(link.quantityPerService)),
      );
      await this.productRepo.save(product);
    }
  }

  async adjustStock(productId: string, businessId: string, delta: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');
    product.quantityOnHand = Math.max(0, product.quantityOnHand + delta);
    return this.productRepo.save(product);
  }
}
