import { handleConfigureWhatsappIntegrationLogic } from './ai-whatsapp-integration.logic.js';
import * as whatsappIntegrationUtil from './ai-whatsapp-integration.util.js';

describe('ai-whatsapp-integration.logic', () => {
  it('updates whatsapp integration settings', async () => {
    const updateSettings = jest.fn(async (_businessId: string, patch: object) => ({
      configured: true,
      usingPlatformDefault: patch,
      source: 'business',
    }));

    const result = await handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: { updateSettings } as any },
      'biz-1',
      {},
      'Set WhatsApp confirmation template to appointment_confirmation',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_whatsapp_integration');
    expect(updateSettings).toHaveBeenCalledWith('biz-1', {
      templateConfirmation: 'appointment_confirmation',
    });
  });

  it('returns guide when no patch fields are parsed', async () => {
    const getPublicSettings = jest.fn(async () => ({
      configured: false,
      usingPlatformDefault: false,
    }));

    const result = await handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: { getPublicSettings } as any },
      'biz-1',
      {},
      'Configure WhatsApp integration for the salon',
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: '/dashboard/settings',
      label: 'Open Settings → WhatsApp',
    });
  });

  it('returns clarify when parse fails', async () => {
    const result = await handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: { updateSettings: jest.fn() } as any },
      'biz-1',
      {},
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns guide when integration is already configured', async () => {
    const result = await handleConfigureWhatsappIntegrationLogic(
      {
        whatsappIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: true,
            usingPlatformDefault: true,
          })),
        } as any,
      },
      'biz-1',
      {},
      'Configure WhatsApp integration for the salon',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('configured');
  });

  it('returns failure when update throws', async () => {
    const result = await handleConfigureWhatsappIntegrationLogic(
      {
        whatsappIntegrationService: {
          updateSettings: jest.fn(async () => {
            throw new Error('Access token is required');
          }),
        } as any,
      },
      'biz-1',
      {},
      'Connect our own WhatsApp Business account',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Access token is required');
  });

  it('updates from params prompt fallback', async () => {
    const updateSettings = jest.fn(async (_businessId: string, patch: object) => patch);
    const result = await handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: { updateSettings } as any },
      'biz-1',
      { _prompt: 'Use platform default WhatsApp connection' },
    );

    expect(result.success).toBe(true);
    expect(updateSettings).toHaveBeenCalledWith('biz-1', {
      usePlatformDefault: true,
    });
  });

  it('returns generic summary when patch labels are empty', async () => {
    jest
      .spyOn(whatsappIntegrationUtil, 'describeWhatsappIntegrationPatch')
      .mockReturnValueOnce([]);

    const result = await handleConfigureWhatsappIntegrationLogic(
      {
        whatsappIntegrationService: {
          updateSettings: jest.fn(async () => ({ configured: true })),
        } as any,
      },
      'biz-1',
      {},
      'Use platform default WhatsApp connection',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toBe('WhatsApp integration updated.');
  });
});
