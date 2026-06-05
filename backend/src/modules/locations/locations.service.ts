import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private locationRepo: Repository<Location>,
  ) {}

  async findAll(businessId: string): Promise<Location[]> {
    return this.locationRepo.find({
      where: { businessId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async create(
    businessId: string,
    dto: {
      name: string;
      address?: string;
      phone?: string;
      timezone?: string;
      isDefault?: boolean;
    },
  ): Promise<Location> {
    if (dto.isDefault) {
      await this.locationRepo.update({ businessId }, { isDefault: false });
    }
    const count = await this.locationRepo.count({
      where: { businessId, isActive: true },
    });
    return this.locationRepo.save(
      this.locationRepo.create({
        businessId,
        name: dto.name.trim(),
        address: dto.address?.trim(),
        phone: dto.phone?.trim(),
        timezone: dto.timezone || 'UTC',
        isDefault: dto.isDefault ?? count === 0,
      }),
    );
  }

  async update(
    id: string,
    businessId: string,
    dto: Partial<Location>,
  ): Promise<Location> {
    const loc = await this.locationRepo.findOne({ where: { id, businessId } });
    if (!loc) throw new NotFoundException('Location not found');
    if (dto.isDefault) {
      await this.locationRepo.update({ businessId }, { isDefault: false });
    }
    Object.assign(loc, dto);
    return this.locationRepo.save(loc);
  }

  async remove(id: string, businessId: string): Promise<void> {
    const loc = await this.locationRepo.findOne({ where: { id, businessId } });
    if (!loc) throw new NotFoundException('Location not found');
    if (loc.isDefault) {
      throw new BadRequestException('Cannot delete the default location');
    }
    loc.isActive = false;
    await this.locationRepo.save(loc);
  }

  async ensureDefaultLocation(businessId: string): Promise<Location> {
    let loc = await this.locationRepo.findOne({
      where: { businessId, isDefault: true, isActive: true },
    });
    if (!loc) {
      loc = await this.create(businessId, {
        name: 'Main location',
        isDefault: true,
      });
    }
    return loc;
  }
}
