import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity.js';
import {
  generateTenantAppInstallSettings,
  mergeTenantAppInstallIntoSettings,
  readTenantAppInstallSettings,
  toTenantAppInstallView,
  type TenantAppInstallView,
} from '../../common/utils/tenant-app-install-settings.util.js';

@Injectable()
export class TenantAppInstallService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private readonly config: ConfigService,
  ) {}

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async ensureForBusiness(business: Business): Promise<TenantAppInstallView> {
    const existing = readTenantAppInstallSettings(business.settings);
    if (existing) {
      return toTenantAppInstallView(business.slug, existing);
    }

    return this.persistGeneratedAssets(business);
  }

  /** Force-regenerate landing URL + QR assets (Growth tab refresh). */
  async regenerateForBusiness(business: Business): Promise<TenantAppInstallView> {
    return this.persistGeneratedAssets(business);
  }

  private async persistGeneratedAssets(
    business: Business,
  ): Promise<TenantAppInstallView> {
    const generated = await generateTenantAppInstallSettings(
      business.slug,
      this.frontendUrl(),
    );
    if (!generated) {
      throw new Error(`Unable to generate app install assets for ${business.slug}`);
    }

    business.settings = mergeTenantAppInstallIntoSettings(
      business.settings ?? {},
      generated,
    );
    await this.businessRepo.save(business);
    return toTenantAppInstallView(business.slug, generated);
  }
}
