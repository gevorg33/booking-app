import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ServiceProduct } from './entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';

export interface ServiceProductLinkView {
  id: string;
  serviceId: string;
  serviceName: string;
  productId: string;
  productName: string;
  quantityPerService: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ServiceProduct) private linkRepo: Repository<ServiceProduct>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
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
        retailPrice: dto.retailPrice ?? 0,
        quantityOnHand: dto.quantityOnHand ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        locationId: dto.locationId || undefined,
      }),
    );
  }

  async linkToService(
    businessId: string,
    serviceId: string,
    productId: string,
    quantityPerService = 1,
  ): Promise<ServiceProduct> {
    await this.ensureService(businessId, serviceId);
    await this.ensureProduct(businessId, productId);

    const existing = await this.linkRepo.findOne({ where: { serviceId, productId } });
    if (existing) {
      existing.quantityPerService = quantityPerService;
      return this.linkRepo.save(existing);
    }

    return this.linkRepo.save(
      this.linkRepo.create({ serviceId, productId, quantityPerService }),
    );
  }

  async listServiceLinks(
    businessId: string,
    filters?: { serviceId?: string; productId?: string },
  ): Promise<ServiceProductLinkView[]> {
    const qb = this.linkRepo
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.product', 'product')
      .innerJoinAndSelect('link.service', 'service')
      .where('product.business_id = :businessId', { businessId })
      .orderBy('service.name', 'ASC')
      .addOrderBy('product.name', 'ASC');

    if (filters?.serviceId) {
      qb.andWhere('link.service_id = :serviceId', { serviceId: filters.serviceId });
    }
    if (filters?.productId) {
      qb.andWhere('link.product_id = :productId', { productId: filters.productId });
    }

    const links = await qb.getMany();
    return links.map((link) => ({
      id: link.id,
      serviceId: link.serviceId,
      serviceName: link.service?.name ?? 'Service',
      productId: link.productId,
      productName: link.product?.name ?? 'Product',
      quantityPerService: Number(link.quantityPerService),
    }));
  }

  async unlinkServiceProduct(linkId: string, businessId: string): Promise<{ removed: true }> {
    const link = await this.linkRepo.findOne({
      where: { id: linkId },
      relations: { product: true },
    });
    if (!link?.product || link.product.businessId !== businessId) {
      throw new NotFoundException('Service link not found');
    }
    await this.linkRepo.delete(linkId);
    return { removed: true };
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

  private async ensureProduct(businessId: string, productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, businessId, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async ensureService(businessId: string, serviceId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }
}
