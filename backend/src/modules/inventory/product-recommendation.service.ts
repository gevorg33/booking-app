import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CategoryRecommendedProduct,
  Product,
  ServiceRecommendedProduct,
} from './entities/inventory.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import {
  mapPublicRecommendationProduct,
  normalizeRecommendationProductIds,
  resolveCheckoutRecommendations,
  type PublicRecommendationProduct,
  type RecommendationLink,
} from '../../common/utils/product-recommendation.util.js';
import { resolveProductRecommendationSettings } from '../../common/utils/product-recommendation-settings.util.js';
import type { Business } from '../business/entities/business.entity.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import {
  buildProductRecommendationAnalyticsPayload,
  eventTypeForProductRecommendationAnalytics,
  isProductInRecommendationList,
  resolveProductRecommendationAnalyticsEvent,
  type ProductRecommendationAnalyticsInput,
} from '../../common/utils/product-recommendation-analytics.util.js';

@Injectable()
export class ProductRecommendationService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ServiceRecommendedProduct)
    private serviceLinkRepo: Repository<ServiceRecommendedProduct>,
    @InjectRepository(CategoryRecommendedProduct)
    private categoryLinkRepo: Repository<CategoryRecommendedProduct>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private categoryRepo: Repository<ServiceCategory>,
    private eventStore: EventStoreService,
  ) {}

  async listServiceRecommendations(
    businessId: string,
    serviceId: string,
  ): Promise<string[]> {
    await this.ensureService(businessId, serviceId);
    const links = await this.serviceLinkRepo.find({
      where: { serviceId },
      order: { sortOrder: 'ASC' },
    });
    return links.map((link) => link.productId);
  }

  async setServiceRecommendations(
    businessId: string,
    serviceId: string,
    productIds: string[],
  ): Promise<string[]> {
    await this.ensureService(businessId, serviceId);
    const links = normalizeRecommendationProductIds(productIds);
    await this.ensureProducts(
      businessId,
      links.map((link) => link.productId),
    );

    await this.serviceLinkRepo.delete({ serviceId });
    if (links.length > 0) {
      await this.serviceLinkRepo.save(
        links.map((link) =>
          this.serviceLinkRepo.create({
            serviceId,
            productId: link.productId,
            sortOrder: link.sortOrder,
          }),
        ),
      );
    }
    return links.map((link) => link.productId);
  }

  async listCategoryRecommendations(
    businessId: string,
    categoryId: string,
  ): Promise<string[]> {
    await this.ensureCategory(businessId, categoryId);
    const links = await this.categoryLinkRepo.find({
      where: { categoryId },
      order: { sortOrder: 'ASC' },
    });
    return links.map((link) => link.productId);
  }

  async setCategoryRecommendations(
    businessId: string,
    categoryId: string,
    productIds: string[],
  ): Promise<string[]> {
    await this.ensureCategory(businessId, categoryId);
    const links = normalizeRecommendationProductIds(productIds);
    await this.ensureProducts(
      businessId,
      links.map((link) => link.productId),
    );

    await this.categoryLinkRepo.delete({ categoryId });
    if (links.length > 0) {
      await this.categoryLinkRepo.save(
        links.map((link) =>
          this.categoryLinkRepo.create({
            categoryId,
            productId: link.productId,
            sortOrder: link.sortOrder,
          }),
        ),
      );
    }
    return links.map((link) => link.productId);
  }

  async getCheckoutRecommendations(
    business: Business,
    serviceId?: string,
    categoryId?: string,
  ): Promise<PublicRecommendationProduct[]> {
    const settings = resolveProductRecommendationSettings(business.settings);
    if (!serviceId && !categoryId) return [];

    let resolvedCategoryId = categoryId?.trim() || undefined;
    if (serviceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: serviceId, businessId: business.id, isActive: true },
        relations: { category: true },
      });
      if (!service) return [];
      resolvedCategoryId =
        resolvedCategoryId ?? service.categoryId ?? undefined;
    }

    const serviceLinks: RecommendationLink[] = serviceId
      ? (
          await this.serviceLinkRepo.find({
            where: { serviceId },
            order: { sortOrder: 'ASC' },
          })
        ).map((link) => ({
          productId: link.productId,
          sortOrder: link.sortOrder,
        }))
      : [];

    const categoryLinks: RecommendationLink[] = resolvedCategoryId
      ? (
          await this.categoryLinkRepo.find({
            where: { categoryId: resolvedCategoryId },
            order: { sortOrder: 'ASC' },
          })
        ).map((link) => ({
          productId: link.productId,
          sortOrder: link.sortOrder,
        }))
      : [];

    const productIds = [
      ...new Set([
        ...serviceLinks.map((link) => link.productId),
        ...categoryLinks.map((link) => link.productId),
      ]),
    ];
    if (productIds.length === 0) return [];

    const products = await this.productRepo.find({
      where: { businessId: business.id, id: In(productIds), isActive: true },
    });

    const resolved = resolveCheckoutRecommendations({
      maxCount: settings.maxProductCount,
      serviceLinks,
      categoryLinks,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        externalLink: product.externalLink,
        retailPrice: Number(product.retailPrice),
        isActive: product.isActive,
      })),
    });

    return resolved.map(mapPublicRecommendationProduct);
  }

  async recordRecommendationEvent(
    business: Business,
    input: ProductRecommendationAnalyticsInput & { event: string },
  ): Promise<{ recorded: boolean }> {
    const analyticsEvent = resolveProductRecommendationAnalyticsEvent(
      input.event,
    );
    if (!analyticsEvent) return { recorded: false };
    if (!input.serviceId?.trim() && !input.categoryId?.trim()) {
      return { recorded: false };
    }

    const productId = input.productId.trim();
    if (!productId) return { recorded: false };

    const recommendations = await this.getCheckoutRecommendations(
      business,
      input.serviceId,
      input.categoryId,
    );
    if (!isProductInRecommendationList(productId, recommendations)) {
      return { recorded: false };
    }

    await this.eventStore.publish({
      eventType: eventTypeForProductRecommendationAnalytics(analyticsEvent),
      aggregateType: 'product_recommendation',
      aggregateId: productId,
      businessId: business.id,
      payload: buildProductRecommendationAnalyticsPayload({
        ...input,
        productId,
      }),
    });

    return { recorded: true };
  }

  private async ensureService(
    businessId: string,
    serviceId: string,
  ): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  private async ensureCategory(
    businessId: string,
    categoryId: string,
  ): Promise<ServiceCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, businessId },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private async ensureProducts(
    businessId: string,
    productIds: string[],
  ): Promise<void> {
    if (productIds.length === 0) return;
    const count = await this.productRepo.count({
      where: { businessId, id: In(productIds) },
    });
    if (count !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }
  }
}
