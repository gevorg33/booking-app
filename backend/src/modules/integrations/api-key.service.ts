import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { BusinessApiKey } from './entities/business-api-key.entity.js';
import { CreateApiKeyDto } from './dto/integrations.dto.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import type { BusinessMember } from '../business/entities/business-member.entity.js';

const KEY_PREFIX = 'osk_live_';
const DEFAULT_SCOPES = ['read:bookings', 'read:customers', 'read:services'];

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(BusinessApiKey)
    private keyRepo: Repository<BusinessApiKey>,
  ) {}

  assertAdminRole(membership: BusinessMember): void {
    if (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can manage API keys');
    }
  }

  async listKeys(businessId: string) {
    const keys = await this.keyRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
    return keys
      .filter((k) => !k.revokedAt)
      .map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: `${k.keyPrefix}…`,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      }));
  }

  async createKey(businessId: string, userId: string, dto: CreateApiKeyDto) {
    const rawSuffix = randomBytes(24).toString('hex');
    const plaintext = `${KEY_PREFIX}${rawSuffix}`;
    const keyPrefix = plaintext.slice(0, 16);
    const keyHash = this.hashKey(plaintext);

    const saved = await this.keyRepo.save(
      this.keyRepo.create({
        businessId,
        name: dto.name.trim(),
        keyPrefix,
        keyHash,
        scopes: dto.scopes?.length ? dto.scopes : DEFAULT_SCOPES,
        createdByUserId: userId,
      }),
    );

    return {
      id: saved.id,
      name: saved.name,
      key: plaintext,
      keyPrefix: `${saved.keyPrefix}…`,
      scopes: saved.scopes,
      createdAt: saved.createdAt,
    };
  }

  async revokeKey(businessId: string, keyId: string) {
    const key = await this.keyRepo.findOne({ where: { id: keyId, businessId } });
    if (!key) throw new NotFoundException('API key not found');
    key.revokedAt = new Date();
    await this.keyRepo.save(key);
    return { revoked: true };
  }

  async validateKey(plaintext: string): Promise<BusinessApiKey | null> {
    if (!plaintext.startsWith(KEY_PREFIX)) return null;
    const prefix = plaintext.slice(0, 16);
    const hash = this.hashKey(plaintext);
    const key = await this.keyRepo.findOne({
      where: { keyPrefix: prefix, keyHash: hash },
    });
    if (!key || key.revokedAt) return null;
    key.lastUsedAt = new Date();
    await this.keyRepo.save(key);
    return key;
  }

  private hashKey(plaintext: string): string {
    return createHash('sha256').update(plaintext).digest('hex');
  }
}
