import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity.js';
import {
  BusinessMember,
  MemberRole,
} from './entities/business-member.entity.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import { applyPublicProfileLocalesToSettings } from '../../common/i18n/business-public-profile-locales.util.js';
import {
  getBusinessDefaultCurrency,
  isSupportedBusinessCurrency,
  normalizeBusinessCurrency,
} from '../../common/utils/business-currency.util.js';
import {
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
} from '../../common/utils/business-date-format.util.js';
import {
  assertBusinessTaxSettings,
  readBusinessTaxSettings,
} from '../../common/utils/business-tax.util.js';
import {
  assertBusinessHipaaSettings,
  assertBusinessPrivacySettings,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
} from '../../common/utils/business-compliance.util.js';
import {
  assertBusinessLocaleSettings,
  getBusinessDefaultLocale,
  getBusinessEnabledLocales,
  mergeBusinessLocaleSettings,
  normalizeAppLocale,
  type AppLocale,
} from '../../common/utils/business-locale.util.js';

import { sanitizeGoogleMapEmbed } from '../../common/utils/google-map-embed.util.js';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(BusinessMember)
    private memberRepo: Repository<BusinessMember>,
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
      const incoming = patch.settings as Record<string, unknown>;
      if (incoming.currency !== undefined) {
        const normalized = normalizeBusinessCurrency(
          incoming.currency as string,
        );
        if (!normalized || !isSupportedBusinessCurrency(normalized)) {
          throw new BadRequestException(
            'Currency must be a supported ISO 4217 code (e.g. USD, EUR, AMD).',
          );
        }
        incoming.currency = normalized;
        incoming.defaultCurrency = normalized;
      }
      if (incoming.dateFormat !== undefined) {
        const normalized = normalizeBusinessDateFormat(
          incoming.dateFormat as string,
        );
        if (!normalized) {
          throw new BadRequestException(
            'Date format must be DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD.',
          );
        }
        incoming.dateFormat = normalized;
      }
      if (incoming.timeFormat !== undefined) {
        const normalized = normalizeBusinessTimeFormat(
          incoming.timeFormat as string,
        );
        if (!normalized) {
          throw new BadRequestException('Time format must be 24h or 12h.');
        }
        incoming.timeFormat = normalized;
      }
      if (incoming.tax !== undefined && incoming.tax !== null) {
        const current = readBusinessTaxSettings(
          business.settings as Record<string, unknown> | undefined,
        );
        try {
          incoming.tax = assertBusinessTaxSettings({
            ...current,
            ...(incoming.tax as Record<string, unknown>),
          });
        } catch (error) {
          throw new BadRequestException(
            error instanceof Error ? error.message : 'Invalid tax settings',
          );
        }
      }
      if (incoming.privacy !== undefined && incoming.privacy !== null) {
        const current = readBusinessPrivacySettings(
          business.settings as Record<string, unknown> | undefined,
        );
        try {
          incoming.privacy = assertBusinessPrivacySettings(
            {
              ...current,
              ...(incoming.privacy as Record<string, unknown>),
            },
            business.settings as Record<string, unknown> | undefined,
          );
        } catch (error) {
          throw new BadRequestException(
            error instanceof Error ? error.message : 'Invalid privacy settings',
          );
        }
      }
      if (incoming.hipaa !== undefined && incoming.hipaa !== null) {
        const current = readBusinessHipaaSettings(
          business.settings as Record<string, unknown> | undefined,
        );
        const businessType = (
          business.settings as Record<string, unknown> | undefined
        )?.businessType as string | undefined;
        try {
          incoming.hipaa = assertBusinessHipaaSettings(
            {
              ...current,
              ...(incoming.hipaa as Record<string, unknown>),
            },
            businessType,
            business.settings as Record<string, unknown> | undefined,
          );
        } catch (error) {
          throw new BadRequestException(
            error instanceof Error ? error.message : 'Invalid HIPAA settings',
          );
        }
      }
      if (
        incoming.enabledLocales !== undefined ||
        incoming.defaultLocale !== undefined
      ) {
        const normalized = assertBusinessLocaleSettings({
          enabledLocales:
            incoming.enabledLocales !== undefined
              ? incoming.enabledLocales
              : getBusinessEnabledLocales(
                  business.settings as Record<string, unknown> | undefined,
                ),
          defaultLocale:
            incoming.defaultLocale !== undefined
              ? incoming.defaultLocale
              : getBusinessDefaultLocale(
                  business.settings as Record<string, unknown> | undefined,
                ),
        });
        Object.assign(
          incoming,
          mergeBusinessLocaleSettings(incoming, normalized),
        );
      }
      patch.settings = mergeBusinessSettings(
        business.settings as Record<string, unknown> | undefined,
        incoming,
      ) as Business['settings'];
    }
    Object.assign(business, patch);
    return this.businessRepo.save(business);
  }

  getDefaultCurrency(business: Business): string {
    return getBusinessDefaultCurrency(
      business.settings as Record<string, unknown> | undefined,
    );
  }

  getEnabledLocales(business: Business): AppLocale[] {
    return getBusinessEnabledLocales(
      business.settings as Record<string, unknown> | undefined,
    );
  }

  getDefaultLocale(business: Business): AppLocale {
    return getBusinessDefaultLocale(
      business.settings as Record<string, unknown> | undefined,
    );
  }

  async updateProfile(
    id: string,
    dto: UpdateBusinessProfileDto,
  ): Promise<Business> {
    const business = await this.findOne(id);

    if (dto.name !== undefined) business.name = dto.name.trim();
    if (dto.description !== undefined)
      business.description = dto.description.trim() || null!;
    if (dto.phone !== undefined) business.phone = dto.phone.trim() || null!;
    if (dto.email !== undefined) business.email = dto.email.trim() || null!;
    if (dto.address !== undefined)
      business.address = dto.address.trim() || null!;

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
      // e2e-bug.49 — allowlist sanitize (reject on* handlers / unknown attrs).
      settings.location = { ...(settings.location || {}) };
      if (mapEmbedHtml) {
        const sanitizedEmbed = sanitizeGoogleMapEmbed(mapEmbedHtml);
        if (!sanitizedEmbed) {
          throw new BadRequestException(
            'Map embed must be a Google Maps iframe embed code.',
          );
        }
        settings.location.mapEmbedHtml = sanitizedEmbed;
      } else {
        delete settings.location.mapEmbedHtml;
      }
    }

    if (dto.embed) {
      settings.embed = { ...(settings.embed || {}), ...dto.embed };
    }

    const enabledLocales = getBusinessEnabledLocales(settings);

    if (dto.locale !== undefined) {
      const locale = normalizeAppLocale(dto.locale);
      if (!locale) {
        throw new BadRequestException(
          'Public default language must be one of: en, hy, ru',
        );
      }
      if (!enabledLocales.includes(locale)) {
        throw new BadRequestException(
          'Public default language must be one of the enabled languages',
        );
      }
      settings.defaultLocale = locale;
      settings.locale = locale;
    }

    const mergedSettings =
      dto.publicProfileLocales !== undefined
        ? applyPublicProfileLocalesToSettings(
            settings,
            dto.publicProfileLocales,
            { enabledLocales },
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

  async ensureMember(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember> {
    const membership = await this.memberRepo.findOne({
      where: { businessId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }
    return membership;
  }

  async ensureOwner(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember> {
    const membership = await this.ensureMember(businessId, userId);
    if (membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the business owner can manage team roles',
      );
    }
    return membership;
  }

  async getMembership(
    businessId: string,
    userId: string,
  ): Promise<BusinessMember | null> {
    return this.memberRepo.findOne({ where: { businessId, userId } });
  }
}
