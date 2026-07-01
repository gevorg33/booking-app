import { handleExplainSalonProfileLogic } from './ai-explain-salon-profile.logic.js';

describe('ai-explain-salon-profile.logic (ai-cmd-customer-4.20.5)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        name: 'Glow Studio',
        description: 'A boutique salon downtown.',
        phone: '+1 555 0100',
        email: 'hello@glow.example',
        address: '12 Main St',
        settings: {
          branding: {
            tagline: 'Feel your best',
            logoUrl: 'https://cdn.example/logo.png',
          },
          social: {
            instagram: 'https://instagram.com/glow',
          },
          location: {
            mapEmbedHtml: '<iframe src="https://maps.example/embed"></iframe>',
          },
        },
      })),
    },
  });

  it('returns salon profile navigation details', async () => {
    const result = await handleExplainSalonProfileLogic(
      deps() as any,
      'biz-1',
      {},
      'Tell me about this salon',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_salon_profile');
    expect(result.summary).toMatch(/Glow Studio/);
    expect(result.details).toMatchObject({
      aspect: 'overview',
      businessName: 'Glow Studio',
      tagline: 'Feel your best',
      navigate: { path: 'profile', query: {} },
      socialLinks: { instagram: 'https://instagram.com/glow' },
      hasMapEmbed: true,
    });
  });

  it('returns failure when business is missing', async () => {
    const result = await handleExplainSalonProfileLogic(
      {
        businessRepo: { findOne: jest.fn(async () => null) },
      } as any,
      'biz-1',
      {},
      'Salon profile',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('explain_salon_profile');
  });

  it('builds aspect-specific summaries', async () => {
    const baseDeps = deps();
    const photos = await handleExplainSalonProfileLogic(
      baseDeps as any,
      'biz-1',
      { aspect: 'photos' },
      'Show photos and reviews',
    );
    expect(photos.summary).toMatch(/photos/i);

    const social = await handleExplainSalonProfileLogic(
      baseDeps as any,
      'biz-1',
      { aspect: 'social' },
      'Show social media links',
    );
    expect(social.summary).toMatch(/Social links/i);

    const reviews = await handleExplainSalonProfileLogic(
      baseDeps as any,
      'biz-1',
      { aspect: 'reviews' },
      'Show reviews',
    );
    expect(reviews.summary).toMatch(/reviews/i);

    const all = await handleExplainSalonProfileLogic(
      baseDeps as any,
      'biz-1',
      { aspect: 'all' },
      'Show me the salon profile page',
    );
    expect(all.summary).toMatch(/Social links/i);
    expect(all.summary).toMatch(/photos/i);
  });

  it('handles sparse salon profile content', async () => {
    const result = await handleExplainSalonProfileLogic(
      {
        businessRepo: {
          findOne: jest.fn(async () => ({
            id: 'biz-2',
            name: 'Minimal Salon',
            settings: {},
          })),
        },
      } as any,
      'biz-2',
      { aspect: 'social' },
      'Show social media links',
    );
    expect(result.summary).toMatch(
      /Social links are listed on the salon profile when configured/,
    );
    expect((result.details as { hasMapEmbed?: boolean }).hasMapEmbed).toBe(
      false,
    );
  });
});
