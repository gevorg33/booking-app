import { CONFIGURE_SERVICE_FEATURED_PROMPTS } from './ai-configure-service-featured.fixtures.js';
import { handleConfigureServiceFeaturedLogic } from './ai-configure-service-featured.logic.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';

describe('configure_service_featured AI scenarios', () => {
  const services = [
    {
      id: 'svc-haircut',
      name: 'Haircut',
      isActive: true,
      category: { name: 'Hair' },
      metadata: {},
    },
  ];

  const serviceService = {
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => ({
      id,
      name: 'Haircut',
      ...dto,
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(CONFIGURE_SERVICE_FEATURED_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via catalog rescue',
    ({ prompt }) => {
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        'configure_service_featured',
      );
    },
  );

  it('disambiguates featured metadata from deposit policy', () => {
    expect(
      rescueCatalogIntent('Mark Haircut as featured', 'unknown')?.action,
    ).toBe('configure_service_featured');
    expect(
      rescueCatalogIntent('Require $25 deposit on featured services', 'unknown'),
    ).toBeNull();
  });

  it('executes configure_service_featured handler', async () => {
    const result = await handleConfigureServiceFeaturedLogic(
      { serviceService } as any,
      'biz-1',
      {},
      services as any,
      'Mark Haircut as a featured service',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_service_featured');
    expect(serviceService.update).toHaveBeenCalledWith(
      'svc-haircut',
      { isFeatured: true },
      undefined,
    );
  });
});
