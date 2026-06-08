import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import {
  AiSettings,
  AutopilotRule,
  BusinessPlaybook,
  BusinessParaphraseEntry,
  DEFAULT_AI_SETTINGS,
  EntityMemory,
  EntityMemoryEntry,
} from './ai-settings.types.js';
import { mergeBusinessParaphrases } from './ai-business-paraphrase.util.js';

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
        paraphrases: ai.entityMemory?.paraphrases ?? [],
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
      accuracyProgram: ai.accuracyProgram ?? DEFAULT_AI_SETTINGS.accuracyProgram,
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
      accuracyProgram: patch.accuracyProgram
        ? { ...current.accuracyProgram, ...patch.accuracyProgram }
        : current.accuracyProgram,
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
      merged[key] = { ...(merged[key] ?? {}), ...entry };
    }

    business.settings = {
      ...business.settings,
      ai: {
        ...current,
        entityMemory: {
          aliases: merged,
          paraphrases: current.entityMemory?.paraphrases ?? [],
          pendingAliasSuggestions:
            current.entityMemory?.pendingAliasSuggestions ?? [],
        },
      },
    };
    await this.businessRepo.save(business);
  }

  async saveEntityMemory(
    businessId: string,
    entityMemory: EntityMemory,
  ): Promise<EntityMemory> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const current = this.mergeSettings(business.settings);
    business.settings = {
      ...business.settings,
      ai: {
        ...current,
        entityMemory,
      },
    };
    await this.businessRepo.save(business);
    return entityMemory;
  }

  async mergeBusinessParaphrases(
    businessId: string,
    incoming: BusinessParaphraseEntry[],
  ): Promise<void> {
    if (incoming.length === 0) return;

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const current = this.mergeSettings(business.settings);
    const merged = mergeBusinessParaphrases(
      current.entityMemory?.paraphrases ?? [],
      incoming,
    );

    business.settings = {
      ...business.settings,
      ai: {
        ...current,
        entityMemory: {
          aliases: current.entityMemory?.aliases ?? {},
          paraphrases: merged,
        },
      },
    };
    await this.businessRepo.save(business);
  }
}
