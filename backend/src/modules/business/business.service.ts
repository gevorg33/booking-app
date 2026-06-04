import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity.js';
import { BusinessMember, MemberRole } from './entities/business-member.entity.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import { applyPublicProfileLocalesToSettings } from '../../common/i18n/business-public-profile-locales.util.js';

const FORBIDDEN_MAP_EMBED = /<script|javascript:/i;

function isValidGoogleMapEmbed(html: string): boolean {
  const trimmed = html.trim();
  if (!/^<iframe[\s\S]*<\/iframe>$/i.test(trimmed)) return false;
  if (FORBIDDEN_MAP_EMBED.test(trimmed)) return false;
  return /google\.[^"'\s>]*\/maps|maps\.google|maps\.googleapis\.com/i.test(trimmed);
}

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
    const patch: Partial<Business> = { ...data };
    if (patch.settings !== undefined && patch.settings !== null) {
      patch.settings = mergeBusinessSettings(
        business.settings as Record<string, unknown> | undefined,
        patch.settings as Record<string, unknown>,
      ) as Business['settings'];
    }
    Object.assign(business, patch);
    return this.businessRepo.save(business);
  }

  async updateProfile(id: string, dto: UpdateBusinessProfileDto): Promise<Business> {
    const business = await this.findOne(id);

    if (dto.name !== undefined) business.name = dto.name.trim();
    if (dto.description !== undefined) business.description = dto.description.trim() || null!;
    if (dto.phone !== undefined) business.phone = dto.phone.trim() || null!;
    if (dto.email !== undefined) business.email = dto.email.trim() || null!;
    if (dto.address !== undefined) business.address = dto.address.trim() || null!;

    const settings = { ...(business.settings || {}) };

    if (dto.branding) {
      settings.branding = { ...(settings.branding || {}) };
      for (const [key, value] of Object.entries(
        this.cleanOptionalStrings({ ...dto.branding }),
      )) {
        if (value) settings.branding[key] = value;
        else delete settings.branding[key];
      }
    }

    if (dto.social) {
      settings.social = { ...(settings.social || {}) };
      for (const [key, value] of Object.entries(
        this.cleanOptionalStrings({ ...dto.social }),
      )) {
        if (value) settings.social[key] = value;
        else delete settings.social[key];
      }
    }

    if (dto.location) {
      const mapEmbedHtml = dto.location.mapEmbedHtml?.trim();
      if (mapEmbedHtml && !isValidGoogleMapEmbed(mapEmbedHtml)) {
        throw new BadRequestException(
          'Map embed must be a Google Maps iframe embed code.',
        );
      }
      settings.location = { ...(settings.location || {}) };
      if (mapEmbedHtml) settings.location.mapEmbedHtml = mapEmbedHtml;
      else delete settings.location.mapEmbedHtml;
    }

    if (dto.embed) {
      settings.embed = { ...(settings.embed || {}), ...dto.embed };
    }

    if (dto.locale !== undefined) {
      settings.locale = dto.locale;
    }

    const mergedSettings =
      dto.publicProfileLocales !== undefined
        ? applyPublicProfileLocalesToSettings(
            settings as Record<string, unknown>,
            dto.publicProfileLocales,
          )
        : settings;

    business.settings = mergedSettings as Business['settings'];
    return this.businessRepo.save(business);
  }

  private cleanOptionalStrings(
    obj: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    const result = { ...obj };
    for (const key of Object.keys(result)) {
      const value = result[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        result[key] = trimmed || undefined;
      }
    }
    return result;
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { business: true },
    });
    return memberships.map((m) => m.business);
  }

  async ensureMember(businessId: string, userId: string): Promise<BusinessMember> {
    const membership = await this.memberRepo.findOne({
      where: { businessId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }
    return membership;
  }

  async ensureOwner(businessId: string, userId: string): Promise<BusinessMember> {
    const membership = await this.ensureMember(businessId, userId);
    if (membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only the business owner can manage team roles');
    }
    return membership;
  }

  async getMembership(businessId: string, userId: string): Promise<BusinessMember | null> {
    return this.memberRepo.findOne({ where: { businessId, userId } });
  }
}
