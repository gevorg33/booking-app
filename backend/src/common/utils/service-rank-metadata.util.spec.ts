import {
  applyServiceRankMetadataToMetadata,
  enrichCatalogEntryWithServiceRankMetadata,
  enrichServiceTierFromPrompt,
  extractServiceRankMetadata,
  extractServiceTierFromPrompt,
  isServiceTierFilterPrompt,
} from './service-rank-metadata.util.js';

describe('service-rank-metadata.util (rank-1.8)', () => {
  describe('extractServiceRankMetadata', () => {
    it('returns empty object when metadata is missing', () => {
      expect(extractServiceRankMetadata(undefined)).toEqual({});
      expect(extractServiceRankMetadata(null)).toEqual({});
    });

    it('reads featured flag and tier only when valid', () => {
      expect(
        extractServiceRankMetadata({
          isFeatured: true,
          serviceTier: 'premium',
          other: 'ignored',
        }),
      ).toEqual({ isFeatured: true, serviceTier: 'premium' });

      expect(
        extractServiceRankMetadata({
          isFeatured: false,
          serviceTier: 'gold',
        }),
      ).toEqual({});
    });
  });

  describe('applyServiceRankMetadataToMetadata', () => {
    it('sets and clears featured and tier fields', () => {
      const base = { localizedNames: { en: ['Cut'] } };

      const withRank = applyServiceRankMetadataToMetadata(base, {
        isFeatured: true,
        serviceTier: 'premium',
      });
      expect(withRank).toEqual({
        localizedNames: { en: ['Cut'] },
        isFeatured: true,
        serviceTier: 'premium',
      });

      const cleared = applyServiceRankMetadataToMetadata(withRank, {
        isFeatured: false,
        serviceTier: '',
      });
      expect(cleared).toEqual({ localizedNames: { en: ['Cut'] } });
    });
  });

  describe('extractServiceTierFromPrompt (rank-tier-metadata-en)', () => {
    it('detects premium tier filter prompts', () => {
      expect(isServiceTierFilterPrompt('Premium tier services for color')).toBe(
        true,
      );
      expect(
        extractServiceTierFromPrompt('Premium tier services for color'),
      ).toBe('premium');
      expect(
        enrichServiceTierFromPrompt({}, 'Premium tier services for color'),
      ).toEqual({ serviceTier: 'premium' });
    });
  });

  describe('enrichCatalogEntryWithServiceRankMetadata', () => {
    it('projects rank fields from metadata onto catalog rows', () => {
      expect(
        enrichCatalogEntryWithServiceRankMetadata({
          id: 'svc-1',
          name: 'Deluxe',
          price: 90,
          metadata: { isFeatured: true, serviceTier: 'premium' },
        }),
      ).toEqual({
        id: 'svc-1',
        name: 'Deluxe',
        price: 90,
        metadata: { isFeatured: true, serviceTier: 'premium' },
        isFeatured: true,
        serviceTier: 'premium',
      });
    });

    it('omits unset rank fields', () => {
      const entry = enrichCatalogEntryWithServiceRankMetadata({
        id: 'svc-2',
        name: 'Basic',
        price: 40,
        metadata: {},
      });
      expect(entry.isFeatured).toBeUndefined();
      expect(entry.serviceTier).toBeUndefined();
    });
  });
});
