import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ServicePackage,
  ServicePackageItem,
  PackagePurchase,
  PackageDiscountType,
} from './entities/service-package.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import {
  calculatePackagePricing,
  allocatePackageLinePricing,
  isPackageOfferExpired,
  isPackagePubliclyVisible,
  isPackageBookable,
  type PackageDiscountType as DiscountType,
} from '../../common/utils/package-pricing.util.js';
import { expandPackageServiceIds } from '../../common/utils/package-booking.util.js';

export interface PackageItemDto {
  serviceId: string;
  quantity: number;
}

export interface CreateServicePackageDto {
  name: string;
  description?: string;
  imageUrl?: string;
  discountType?: DiscountType;
  discountValue?: number;
  displayOrder?: number;
  expiresAt?: string | null;
  items: PackageItemDto[];
}

export type PackageListFilter = 'active' | 'inactive' | 'expired' | 'all';

@Injectable()
export class ServicePackagesService {
  constructor(
    @InjectRepository(ServicePackage)
    private packageRepo: Repository<ServicePackage>,
    @InjectRepository(ServicePackageItem)
    private itemRepo: Repository<ServicePackageItem>,
    @InjectRepository(PackagePurchase)
    private purchaseRepo: Repository<PackagePurchase>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async listPackages(
    businessId: string,
    filter: PackageListFilter = 'all',
    includeInactive = false,
  ) {
    const where = this.buildListWhere(businessId, filter, includeInactive);
    let packages = await this.packageRepo.find({
      where,
      relations: { items: { service: true } },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    if (filter === 'expired') {
      packages = packages.filter(
        (pkg) => pkg.isActive && isPackageOfferExpired(pkg.expiresAt),
      );
    } else if (filter === 'active') {
      packages = packages.filter(
        (pkg) => pkg.isActive && !isPackageOfferExpired(pkg.expiresAt),
      );
    }

    return packages.map((pkg) => this.enrichPackage(pkg));
  }

  async getPackage(businessId: string, packageId: string) {
    const pkg = await this.findPackageOrThrow(businessId, packageId);
    return this.enrichPackage(pkg);
  }

  async createPackage(businessId: string, dto: CreateServicePackageDto) {
    await this.validateItems(businessId, dto.items);
    this.validateDiscount(dto.discountType, dto.discountValue);

    const pkg = this.packageRepo.create({
      businessId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      imageUrl: dto.imageUrl?.trim() || null,
      discountType: dto.discountType ?? PackageDiscountType.PERCENT,
      discountValue: dto.discountValue ?? 0,
      displayOrder: dto.displayOrder ?? 0,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: true,
      items: dto.items.map((item, index) =>
        this.itemRepo.create({
          serviceId: item.serviceId,
          quantity: item.quantity,
          sortOrder: index,
        }),
      ),
    });
    const saved = await this.packageRepo.save(pkg);
    return this.getPackage(businessId, saved.id);
  }

  async updatePackage(
    businessId: string,
    packageId: string,
    dto: Partial<CreateServicePackageDto & { isActive: boolean }>,
  ) {
    const pkg = await this.findPackageOrThrow(businessId, packageId);
    if (dto.items) {
      await this.validateItems(businessId, dto.items);
    }
    if (dto.discountType !== undefined || dto.discountValue !== undefined) {
      this.validateDiscount(
        (dto.discountType ?? pkg.discountType) as DiscountType,
        dto.discountValue ?? Number(pkg.discountValue),
      );
    }

    Object.assign(pkg, {
      name: dto.name?.trim() ?? pkg.name,
      description:
        dto.description !== undefined
          ? dto.description?.trim() || null
          : pkg.description,
      imageUrl:
        dto.imageUrl !== undefined
          ? dto.imageUrl?.trim() || null
          : pkg.imageUrl,
      discountType: dto.discountType ?? pkg.discountType,
      discountValue: dto.discountValue ?? pkg.discountValue,
      displayOrder: dto.displayOrder ?? pkg.displayOrder,
      expiresAt:
        dto.expiresAt !== undefined
          ? dto.expiresAt
            ? new Date(dto.expiresAt)
            : null
          : pkg.expiresAt,
      isActive: dto.isActive ?? pkg.isActive,
    });

    await this.packageRepo.save(pkg);

    if (dto.items) {
      await this.itemRepo.delete({ packageId: pkg.id });
      const items = dto.items.map((item, index) =>
        this.itemRepo.create({
          packageId: pkg.id,
          serviceId: item.serviceId,
          quantity: item.quantity,
          sortOrder: index,
        }),
      );
      await this.itemRepo.save(items);
    }

    return this.getPackage(businessId, packageId);
  }

  async deactivatePackage(businessId: string, packageId: string) {
    return this.updatePackage(businessId, packageId, { isActive: false });
  }

  async activatePackage(businessId: string, packageId: string) {
    const pkg = await this.findPackageOrThrow(businessId, packageId);
    if (pkg.isActive) {
      throw new BadRequestException('Package is already active');
    }
    if (isPackageOfferExpired(pkg.expiresAt)) {
      throw new BadRequestException(
        'Cannot activate an expired package. Update the expiration date first.',
      );
    }
    return this.updatePackage(businessId, packageId, { isActive: true });
  }

  async deletePackage(businessId: string, packageId: string) {
    const pkg = await this.findPackageOrThrow(businessId, packageId);
    if (pkg.isActive) {
      throw new BadRequestException(
        'Deactivate the package before deleting it',
      );
    }

    const futureBookings = await this.countFutureBookingsForPackage(packageId);
    if (futureBookings > 0) {
      throw new ConflictException(
        'Cannot delete a package with upcoming bookings. Keep it deactivated instead.',
      );
    }

    const purchasesCount = await this.purchaseRepo.count({
      where: { packageId },
    });
    if (purchasesCount > 0) {
      throw new ConflictException(
        'Cannot delete a package that has purchase history. Keep it deactivated instead.',
      );
    }

    await this.packageRepo.remove(pkg);
    return { deleted: true, id: packageId };
  }

  async duplicatePackage(businessId: string, packageId: string) {
    const source = await this.findPackageOrThrow(businessId, packageId);
    return this.createPackage(businessId, {
      name: `${source.name.trim()} (Copy)`,
      description: source.description ?? undefined,
      imageUrl: source.imageUrl ?? undefined,
      discountType: source.discountType as DiscountType,
      discountValue: Number(source.discountValue),
      displayOrder: source.displayOrder + 1,
      expiresAt: source.expiresAt?.toISOString() ?? null,
      items: (source.items ?? []).map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
      })),
    });
  }

  async previewPackagePricing(businessId: string, packageId: string) {
    const pkg = await this.findPackageOrThrow(businessId, packageId);
    return this.previewFromPackage(pkg);
  }

  previewFromPackage(pkg: ServicePackage) {
    const items = (pkg.items ?? []).map((item) => ({
      unitPrice: Number(item.service?.price ?? 0),
      quantity: item.quantity,
      serviceId: item.serviceId,
      serviceName: item.service?.name ?? '',
      durationMinutes: item.service?.durationMinutes ?? 0,
      bufferMinutes: item.service?.bufferMinutes ?? 0,
    }));

    const pricing = calculatePackagePricing(
      items.map(({ unitPrice, quantity }) => ({ unitPrice, quantity })),
      pkg.discountType as DiscountType,
      Number(pkg.discountValue),
    );

    const lineAllocations = allocatePackageLinePricing(
      items.map(({ unitPrice, quantity }) => ({ unitPrice, quantity })),
      pricing.packagePrice,
    );

    const itemsWithPricing = items.map((item, index) => ({
      ...item,
      lineTotal: lineAllocations[index].lineTotal,
      discountedLineTotal: lineAllocations[index].discountedLineTotal,
      lineSavings: lineAllocations[index].lineSavings,
    }));

    const currency = pkg.items?.[0]?.service?.currency ?? 'USD';

    return {
      package: {
        id: pkg.id,
        name: pkg.name,
        discountType: pkg.discountType,
        discountValue: Number(pkg.discountValue),
      },
      items: itemsWithPricing,
      pricing,
      currency,
    };
  }

  enrichPackage(pkg: ServicePackage) {
    const preview = this.previewFromPackage(pkg);
    const status = this.resolveStatus(pkg);
    return {
      ...pkg,
      status,
      isExpired: status === 'expired',
      isPubliclyVisible: isPackagePubliclyVisible(pkg.isActive, pkg.expiresAt),
      preview,
    };
  }

  resolveStatus(
    pkg: ServicePackage,
    now = new Date(),
  ): 'active' | 'inactive' | 'expired' {
    if (!pkg.isActive) return 'inactive';
    if (isPackageOfferExpired(pkg.expiresAt, now)) return 'expired';
    return 'active';
  }

  async listPublicPackages(businessId: string, graceHours = 0) {
    const packages = await this.packageRepo.find({
      where: { businessId, isActive: true },
      relations: { items: { service: true } },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
    return packages
      .filter(
        (pkg) =>
          pkg.items?.length &&
          isPackageBookable(pkg.isActive, pkg.expiresAt, graceHours),
      )
      .map((pkg) => this.mapPublicPackage(pkg));
  }

  async getPublicPackage(
    businessId: string,
    packageId: string,
    graceHours = 0,
  ) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, businessId, isActive: true },
      relations: { items: { service: true } },
    });
    if (!pkg || !pkg.items?.length) {
      throw new NotFoundException('Service package not found');
    }
    if (!isPackageBookable(pkg.isActive, pkg.expiresAt, graceHours)) {
      throw new NotFoundException('Service package is not available');
    }
    return this.mapPublicPackage(pkg);
  }

  async assertPackageBookable(
    businessId: string,
    packageId: string,
    graceHours = 0,
  ) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, businessId },
      relations: { items: { service: true } },
    });
    if (!pkg || !pkg.items?.length) {
      throw new NotFoundException('Service package not found');
    }
    if (!isPackageBookable(pkg.isActive, pkg.expiresAt, graceHours)) {
      throw new BadRequestException(
        'This package offer is no longer available',
      );
    }
    return pkg;
  }

  expectedLineServiceIds(pkg: ServicePackage): string[] {
    return expandPackageServiceIds(
      (pkg.items ?? []).map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
      })),
    );
  }

  async createPackagePurchase(
    businessId: string,
    packageId: string,
    customerId: string,
    pricePaid: number,
    currency: string,
  ) {
    return this.purchaseRepo.save(
      this.purchaseRepo.create({
        businessId,
        packageId,
        customerId,
        pricePaid,
        currency,
      }),
    );
  }

  mapPublicPackage(pkg: ServicePackage) {
    const preview = this.previewFromPackage(pkg);
    const totalDurationMinutes = preview.items.reduce(
      (sum, item) => sum + item.durationMinutes * item.quantity,
      0,
    );
    return {
      id: pkg.id,
      kind: 'package' as const,
      name: pkg.name,
      description: pkg.description,
      imageUrl: pkg.imageUrl,
      expiresAt: pkg.expiresAt,
      displayOrder: pkg.displayOrder,
      items: preview.items,
      pricing: preview.pricing,
      currency: preview.currency,
      totalDurationMinutes,
    };
  }

  private buildListWhere(
    businessId: string,
    filter: PackageListFilter,
    includeInactive: boolean,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { businessId };
    if (filter === 'inactive') {
      where.isActive = false;
      return where;
    }
    if (filter === 'expired') {
      where.isActive = true;
      return where;
    }
    if (filter === 'active' || !includeInactive) {
      where.isActive = true;
    }
    return where;
  }

  private async findPackageOrThrow(businessId: string, packageId: string) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, businessId },
      relations: { items: { service: true } },
    });
    if (!pkg) throw new NotFoundException('Service package not found');
    if (!pkg.items?.length) {
      throw new BadRequestException('Package has no services configured');
    }
    return pkg;
  }

  private async validateItems(businessId: string, items: PackageItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException('At least one service is required');
    }
    const serviceIds = items.map((item) => item.serviceId);
    if (new Set(serviceIds).size !== serviceIds.length) {
      throw new BadRequestException(
        'Duplicate services are not allowed in a package',
      );
    }
    for (const item of items) {
      if (item.quantity < 1) {
        throw new BadRequestException(
          'Each service quantity must be at least 1',
        );
      }
    }

    const services = await this.serviceRepo.find({
      where: { businessId, id: In(serviceIds), isActive: true },
    });
    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services were not found');
    }
  }

  private validateDiscount(
    discountType: DiscountType | undefined,
    discountValue: number | undefined,
  ) {
    const type = discountType ?? PackageDiscountType.PERCENT;
    const value = discountValue ?? 0;
    if (value < 0) {
      throw new BadRequestException('Discount value cannot be negative');
    }
    if (type === PackageDiscountType.PERCENT && value > 100) {
      throw new BadRequestException('Percent discount cannot exceed 100');
    }
  }

  private async countFutureBookingsForPackage(packageId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { packageId },
      select: { id: true },
    });
    if (!purchases.length) return 0;

    const purchaseIds = purchases.map((p) => p.id);
    const now = new Date();
    return this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.package_purchase_id IN (:...purchaseIds)', {
        purchaseIds,
      })
      .andWhere('booking.start_time > :now', { now })
      .andWhere('booking.status NOT IN (:...statuses)', {
        statuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      })
      .getCount();
  }
}
