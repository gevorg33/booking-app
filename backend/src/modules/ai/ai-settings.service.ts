import { stripSharedEntityMemoryPii } from './ai-entity-memory.util.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import {
  AiSettings,
  AutopilotRule,
  BusinessPlaybook,
  DEFAULT_AI_SETTINGS,
  EntityMemory,
  EntityMemoryEntry,
} from './ai-settings.types.js';

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
  ) {}

  mergeSettings(raw?: Record<string, unknown>): AiSettings {
    const ai = (raw?.ai ?? {}) as Partial<AiSettings>;
    return {
      autopilot: {
        enabled: ai.autopilot?.enabled ?? DEFAULT_AI_SETTINGS.autopilot.enabled,
        rules: ai.autopilot?.rules?.length
          ? ai.autopilot.rules
          : DEFAULT_AI_SETTINGS.autopilot.rules,
      },
      playbooks: ai.playbooks?.length
        ? ai.playbooks
        : DEFAULT_AI_SETTINGS.playbooks,
      macros: ai.macros?.length ? ai.macros : DEFAULT_AI_SETTINGS.macros,
      confidence: {
        low: ai.confidence?.low ?? DEFAULT_AI_SETTINGS.confidence.low,
        high: ai.confidence?.high ?? DEFAULT_AI_SETTINGS.confidence.high,
      },
      entityMemory: {
        aliases:
          ai.entityMemory?.aliases ??
          DEFAULT_AI_SETTINGS.entityMemory?.aliases ??
          {},
      },
      rag: {
        enabled: ai.rag?.enabled ?? DEFAULT_AI_SETTINGS.rag?.enabled ?? false,
        documents: ai.rag?.documents?.length
          ? ai.rag.documents
          : (DEFAULT_AI_SETTINGS.rag?.documents ?? []),
      },
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        ...ai.enterprise,
        roleProfiles: {
          ...DEFAULT_AI_SETTINGS.enterprise?.roleProfiles,
          ...ai.enterprise?.roleProfiles,
        },
        abExperiments: ai.enterprise?.abExperiments?.length
          ? ai.enterprise.abExperiments
          : DEFAULT_AI_SETTINGS.enterprise?.abExperiments,
      },
    };
  }

  async getBusinessRecord(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async getSettings(businessId: string): Promise<AiSettings> {
    const business = await this.getBusinessRecord(businessId);
    return this.mergeSettings(business.settings);
  }

  async updateSettings(
    businessId: string,
    patch: Partial<AiSettings>,
  ): Promise<AiSettings> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const current = this.mergeSettings(business.settings);
    const next: AiSettings = {
      autopilot: { ...current.autopilot, ...patch.autopilot },
      playbooks: patch.playbooks ?? current.playbooks,
      macros: patch.macros ?? current.macros,
      confidence: { ...current.confidence, ...patch.confidence },
      entityMemory: patch.entityMemory ?? current.entityMemory,
      rag: patch.rag ? { ...current.rag, ...patch.rag } : current.rag,
      enterprise: patch.enterprise
        ? { ...current.enterprise, ...patch.enterprise }
        : current.enterprise,
    };

    business.settings = { ...business.settings, ai: next };
    await this.businessRepo.save(business);
    return next;
  }

  matchPlaybook(settings: AiSettings, prompt: string): BusinessPlaybook | null {
    const lower = prompt.toLowerCase().trim();
    for (const pb of settings.playbooks) {
      if (!pb.enabled) continue;
      if (pb.triggers.some((t) => lower.includes(t.toLowerCase()))) {
        return pb;
      }
      if (lower.includes(pb.name.toLowerCase())) {
        return pb;
      }
    }
    return null;
  }

  async markAutopilotRun(businessId: string, ruleId: string): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return;

    const settings = this.mergeSettings(business.settings);
    settings.autopilot.rules = settings.autopilot.rules.map(
      (r: AutopilotRule) =>
        r.id === ruleId ? { ...r, lastRunAt: new Date().toISOString() } : r,
    );
    business.settings = { ...business.settings, ai: settings };
    await this.businessRepo.save(business);
  }

  async listAutopilotBusinesses(): Promise<
    Array<{ businessId: string; settings: AiSettings }>
  > {
    const businesses = await this.businessRepo.find({
      select: { id: true, settings: true },
    });
    return businesses
      .map((b) => ({
        businessId: b.id,
        settings: this.mergeSettings(b.settings),
      }))
      .filter((b) => b.settings.autopilot.enabled);
  }

  async getEntityMemory(businessId: string): Promise<EntityMemory> {
    const settings = await this.getSettings(businessId);
    return settings.entityMemory ?? { aliases: {} };
  }

  async mergeEntityMemory(
    businessId: string,
    aliases: Record<string, EntityMemoryEntry>,
  ): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const current = this.mergeSettings(business.settings);
    const merged = { ...(current.entityMemory?.aliases ?? {}) };

    for (const [alias, entry] of Object.entries(aliases)) {
      const key = alias.toLowerCase().trim();
      if (!key) continue;
      // e2e-bug.371 — the shared map is per-business and carries no user
      // dimension, so a customer's name learned in one conversation would be
      // served to every other user of the business.
      merged[key] = {
        ...(merged[key] ?? {}),
        ...stripSharedEntityMemoryPii(entry),
      };
    }

    business.settings = {
      ...business.settings,
      ai: { ...current, entityMemory: { aliases: merged } },
    };
    await this.businessRepo.save(business);
  }
}
