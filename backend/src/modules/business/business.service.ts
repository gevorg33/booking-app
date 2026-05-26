import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity.js';
import { BusinessMember } from './entities/business-member.entity.js';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember) private memberRepo: Repository<BusinessMember>,
  ) {}

  async findOne(id: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findBySlug(slug: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async update(id: string, data: Partial<Business>): Promise<Business> {
    const business = await this.findOne(id);
    Object.assign(business, data);
    return this.businessRepo.save(business);
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { business: true },
    });
    return memberships.map((m) => m.business);
  }
}
