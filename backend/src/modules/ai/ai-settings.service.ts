import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import {
  AiSettings,
  AutopilotRule,
  BusinessPlaybook,
  DEFAULT_AI_SETTINGS,
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
      playbooks: ai.playbooks?.length ? ai.playbooks : DEFAULT_AI_SETTINGS.playbooks,
      confidence: {
        low: ai.confidence?.low ?? DEFAULT_AI_SETTINGS.confidence.low,
        high: ai.confidence?.high ?? DEFAULT_AI_SETTINGS.confidence.high,
      },
    };
  }

  async getSettings(businessId: string): Promise<AiSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return this.mergeSettings(business.settings);
  }

  async updateSettings(businessId: string, patch: Partial<AiSettings>): Promise<AiSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const current = this.mergeSettings(business.settings);
    const next: AiSettings = {
      autopilot: { ...current.autopilot, ...patch.autopilot },
      playbooks: patch.playbooks ?? current.playbooks,
      confidence: { ...current.confidence, ...patch.confidence },
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
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) return;

    const settings = this.mergeSettings(business.settings);
    settings.autopilot.rules = settings.autopilot.rules.map((r: AutopilotRule) =>
      r.id === ruleId ? { ...r, lastRunAt: new Date().toISOString() } : r,
    );
    business.settings = { ...business.settings, ai: settings };
    await this.businessRepo.save(business);
  }

  async listAutopilotBusinesses(): Promise<Array<{ businessId: string; settings: AiSettings }>> {
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
}
