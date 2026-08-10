import {
  handleConfigureReferralProgramLogic,
  handleConfigureStaffMessageTemplatesLogic,
  type ReferralStaffTemplatesLogicDeps,
} from './ai-referral-staff-templates.logic.js';

describe('ai-referral-staff-templates.logic', () => {
  function buildDeps(settings: Record<string, unknown> = {}) {
    const business = { id: 'biz-1', settings: { ...settings } };
    return {
      businessRepo: {
        findOne: jest.fn(async () => ({
          ...business,
          settings: { ...settings },
        })),
        save: jest.fn(async (b: any) => b),
      },
    } as unknown as ReferralStaffTemplatesLogicDeps & {
      businessRepo: { findOne: jest.Mock; save: jest.Mock };
    };
  }

  describe('handleConfigureReferralProgramLogic', () => {
    it('updates referral program settings', async () => {
      const deps = buildDeps();
      const result = await handleConfigureReferralProgramLogic(deps, 'biz-1', {
        enabled: true,
        referrerRewardType: 'gift_card',
        referrerGiftCardAmount: 20,
      });
      expect(result.success).toBe(true);
      expect((result.details as any).referralProgram.enabled).toBe(true);
      expect((result.details as any).referralProgram.referrerRewardType).toBe(
        'gift_card',
      );
      expect(deps.businessRepo.save).toHaveBeenCalled();
    });

    it('clarifies when no fields are provided', async () => {
      const deps = buildDeps();
      const result = await handleConfigureReferralProgramLogic(
        deps,
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('ignores an invalid referrerRewardType', async () => {
      const deps = buildDeps();
      const result = await handleConfigureReferralProgramLogic(deps, 'biz-1', {
        referrerRewardType: 'not_a_real_type',
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails when business is not found', async () => {
      const deps = buildDeps();
      deps.businessRepo.findOne = jest.fn(async () => null);
      const result = await handleConfigureReferralProgramLogic(deps, 'biz-1', {
        enabled: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('handleConfigureStaffMessageTemplatesLogic', () => {
    it('bulk-replaces templates', async () => {
      const deps = buildDeps();
      const result = await handleConfigureStaffMessageTemplatesLogic(
        deps,
        'biz-1',
        {
          enabled: true,
          templates: [
            { label: 'Running late', body: 'Hi {customerName}, running late!' },
          ],
        },
      );
      expect(result.success).toBe(true);
      expect(
        (result.details as any).staffMessageTemplates.templates,
      ).toHaveLength(1);
      expect(deps.businessRepo.save).toHaveBeenCalled();
    });

    it('toggles enabled without touching templates', async () => {
      const deps = buildDeps({
        staffMessageTemplates: {
          enabled: true,
          templates: [{ id: 'a', label: 'A', body: 'Hi', enabled: true }],
        },
      });
      const result = await handleConfigureStaffMessageTemplatesLogic(
        deps,
        'biz-1',
        { enabled: false },
      );
      expect(result.success).toBe(true);
      expect((result.details as any).staffMessageTemplates.enabled).toBe(false);
      expect(
        (result.details as any).staffMessageTemplates.templates,
      ).toHaveLength(1);
    });

    it('clarifies when no fields are provided', async () => {
      const deps = buildDeps();
      const result = await handleConfigureStaffMessageTemplatesLogic(
        deps,
        'biz-1',
        {},
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails when business is not found', async () => {
      const deps = buildDeps();
      deps.businessRepo.findOne = jest.fn(async () => null);
      const result = await handleConfigureStaffMessageTemplatesLogic(
        deps,
        'biz-1',
        { enabled: true },
      );
      expect(result.success).toBe(false);
    });
  });
});
