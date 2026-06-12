import { Injectable, Logger } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service.js';
import { resolveRagContextFromSettings } from './ai-rag.util.js';
import {
  EmbeddingIndex,
  type EmbeddingIndexEntry,
} from './ai-embedding-index.util.js';
import type { IntentAnchor } from './ai-semantic-intent.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export const SEMANTIC_ANCHOR_INDEX_NAMESPACE = 'semantic_intent_anchor';

export interface SemanticAnchorIndexMetadata {
  action: string;
  locale: string;
  surfaces: CommandSurface[];
  paramHints?: Record<string, unknown>;
  source?: 'canonical' | 'eval';
}

@Injectable()
export class AiRagService {
  private readonly logger = new Logger(AiRagService.name);
  private readonly aiSettings: AiSettingsService;
  private readonly semanticAnchorIndex =
    new EmbeddingIndex<SemanticAnchorIndexMetadata>();

  constructor(aiSettings: AiSettingsService) {
    this.aiSettings = aiSettings;
  }

  async buildRagContextBlock(
    businessId: string,
    prompt: string,
  ): Promise<string> {
    const settings = await this.getSettings(businessId);
    return resolveRagContextFromSettings(settings, prompt);
  }

  async getSettings(businessId: string) {
    return this.aiSettings.getSettings(businessId);
  }

  /** Register semantic intent anchors in the shared embedding index (acc-3.11). */
  registerSemanticAnchors(anchors: IntentAnchor[]): void {
    if (this.semanticAnchorIndex.size === 0) {
      for (const anchor of anchors) {
        this.semanticAnchorIndex.register(this.anchorToIndexEntry(anchor));
      }
      this.logger.log(
        `Semantic anchor index registered: ${this.semanticAnchorIndex.size} entries`,
      );
      return;
    }

    for (const anchor of anchors) {
      if (this.semanticAnchorIndex.get(anchor.id)) continue;
      this.semanticAnchorIndex.register(this.anchorToIndexEntry(anchor));
    }
  }

  setSemanticAnchorEmbedding(id: string, embedding: number[]): void {
    this.semanticAnchorIndex.setEmbedding(id, embedding);
  }

  semanticAnchorIndexSize(): number {
    return this.semanticAnchorIndex.size;
  }

  semanticAnchorEmbeddedCount(): number {
    return this.semanticAnchorIndex.embeddedCount();
  }

  hasSemanticAnchorEmbedding(id: string): boolean {
    return Boolean(this.semanticAnchorIndex.get(id)?.embedding?.length);
  }

  searchSemanticAnchors(
    queryEmbedding: number[],
    options: {
      surface: CommandSurface;
      allowedActions?: string[];
      minScore?: number;
      limit?: number;
    },
  ) {
    return this.semanticAnchorIndex.searchByEmbedding(queryEmbedding, {
      minScore: options.minScore,
      limit: options.limit,
      filter: (entry) => {
        const meta = entry.metadata;
        if (!meta) return false;
        if (!meta.surfaces.includes(options.surface)) return false;
        if (
          options.allowedActions?.length &&
          !options.allowedActions.includes(meta.action)
        ) {
          return false;
        }
        return true;
      },
    });
  }

  getSemanticAnchorEntries(): EmbeddingIndexEntry<SemanticAnchorIndexMetadata>[] {
    return [...this.semanticAnchorIndex.values()];
  }

  private anchorToIndexEntry(
    anchor: IntentAnchor,
  ): EmbeddingIndexEntry<SemanticAnchorIndexMetadata> {
    return {
      id: anchor.id,
      text: anchor.phrase,
      metadata: {
        action: anchor.action,
        locale: anchor.locale,
        surfaces: anchor.surfaces,
        paramHints: anchor.paramHints,
        source: anchor.source,
      },
    };
  }
}
