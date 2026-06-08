import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import {
  aggregateAliasSuggestionsFromCorrections,
  filterSuggestionsAgainstExistingAliases,
  harvestAliasCorrectionsFromTraces,
  type AiTraceAliasHarvestRow,
} from './ai-alias-suggestion.util.js';

export interface AliasSuggestionHarvestResult {
  periodDays: number;
  correctionEvents: number;
  newSuggestions: number;
  pendingTotal: number;
}

@Injectable()
export class AiAliasSuggestionService {
  private readonly logger = new Logger(AiAliasSuggestionService.name);

  constructor(
    @InjectRepository(AiCommandTrace)
    private readonly traceRepo: Repository<AiCommandTrace>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly entityMemory: AiEntityMemoryService,
  ) {}

  async harvestForBusiness(
    businessId: string,
    periodDays = 30,
  ): Promise<AliasSuggestionHarvestResult> {
    const rows = await this.loadTraceRowsForAliasHarvest(businessId, periodDays);
    const corrections = harvestAliasCorrectionsFromTraces(rows);
    const memory = await this.entityMemory.getEntityMemory(businessId);
    const suggestions = filterSuggestionsAgainstExistingAliases(
      aggregateAliasSuggestionsFromCorrections(corrections),
      memory.aliases ?? {},
    );

    const updated = suggestions.length
      ? await this.entityMemory.mergeAliasSuggestions(businessId, suggestions)
      : memory;

    return {
      periodDays,
      correctionEvents: corrections.length,
      newSuggestions: suggestions.length,
      pendingTotal: updated.pendingAliasSuggestions?.length ?? 0,
    };
  }

  async harvestAllBusinesses(periodDays = 30): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
      select: { id: true },
      take: 500,
    });
    let totalSuggestions = 0;
    for (const { id } of businesses) {
      try {
        const result = await this.harvestForBusiness(id, periodDays);
        totalSuggestions += result.newSuggestions;
      } catch (error) {
        this.logger.warn(
          `Alias suggestion harvest failed for ${id}: ${(error as Error).message}`,
        );
      }
    }
    if (totalSuggestions > 0) {
      this.logger.log(`Harvested ${totalSuggestions} alias suggestion(s)`);
    }
    return totalSuggestions;
  }

  async loadTraceRowsForAliasHarvest(
    businessId: string,
    periodDays: number,
  ): Promise<AiTraceAliasHarvestRow[]> {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - periodDays);
    const traces = await this.traceRepo.find({
      where: {
        businessId,
        createdAt: MoreThan(start),
      },
      order: { createdAt: 'ASC' },
      take: 10000,
    });
    return traces.map((trace) => ({
      traceId: trace.traceId,
      rawPrompt: trace.rawPrompt,
      action: trace.action,
      outcome: trace.outcome,
      params: trace.params,
      feedbackReason: trace.feedbackReason,
      feedbackRating: trace.feedbackRating,
      failureSignal: trace.failureSignal,
      correctedAction: trace.correctedAction,
      createdAt: trace.createdAt,
      userId: trace.userId,
    }));
  }
}
