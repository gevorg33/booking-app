import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  CREATE_SERVICE_PREPAYMENT_PROMPTS,
  CREATE_SERVICE_PREPAYMENT_RESCUE_SCENARIOS,
} from './ai-create-service-prepayment.fixtures.js';
import {
  CREATE_SERVICES_PREPAYMENT_PROMPTS,
  CREATE_SERVICES_PREPAYMENT_RESCUE_SCENARIOS,
} from './ai-create-services-prepayment.fixtures.js';
import {
  buildCreateServicePrepaymentFields,
  enrichCreateServicesPrepaymentParamsFromPrompt,
  hasCreateServicesCue,
  isCreateServicesPrepaymentPrompt,
  rescueCreateServicesPrepaymentIntent,
  splitBulkCreateServiceSegments,
  enrichCreateServicePrepaymentParamsFromPrompt,
  isCreateServicePrepaymentPrompt,
  parseCreateServicePrepaymentFromPrompt,
  rescueCreateServicePrepaymentIntent,
} from './ai-create-service-prepayment.util.js';
import { enrichCreateServiceParamsFromPrompt } from './ai-catalog.util.js';

describe('ai-create-service-prepayment.util (ai-cmd-ext-5.2)', () => {
  it.each(CREATE_SERVICE_PREPAYMENT_PROMPTS)(
    'detects create service prepayment prompt $id',
    ({ prompt }) => {
      expect(isCreateServicePrepaymentPrompt(prompt)).toBe(true);
    },
  );

  it.each(CREATE_SERVICE_PREPAYMENT_PROMPTS)(
    'parses prepayment params for $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseCreateServicePrepaymentFromPrompt(prompt, {});
      expect(parsed?.prepaymentMode).toBe(paramsPartial?.prepaymentMode);
      if (paramsPartial?.depositPercent !== undefined) {
        expect(parsed?.depositPercent).toBe(paramsPartial.depositPercent);
      }
      if (paramsPartial?.depositAmount !== undefined) {
        expect(parsed?.depositAmount).toBe(paramsPartial.depositAmount);
      }
    },
  );

  it.each(CREATE_SERVICE_PREPAYMENT_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction to create_service for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueCreateServicePrepaymentIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'create_service_prepayment',
      });
    },
  );

  it('does not steal configure all-services prompts', () => {
    expect(
      isCreateServicePrepaymentPrompt(
        'Accept online payment on public booking for all services with 50% prepayment',
      ),
    ).toBe(false);
    expect(
      rescueCreateServicePrepaymentIntent(
        'Accept online payment on public booking for all services with 50% prepayment',
        'unknown',
      ),
    ).toBeNull();
  });

  it('builds deposit amount for non-default percentages', () => {
    expect(
      buildCreateServicePrepaymentFields(
        { prepaymentMode: 'deposit', depositPercent: 25 },
        'Add color treatment 90min $180 with 25% online prepayment',
        180,
      ),
    ).toEqual({
      prepaymentMode: PrepaymentMode.DEPOSIT,
      depositAmount: 45,
    });
  });

  it('builds full prepayment fields', () => {
    expect(
      buildCreateServicePrepaymentFields(
        { prepaymentMode: 'full' },
        'Create service Facemassage 60min $50 with full prepayment',
        50,
      ),
    ).toEqual({ prepaymentMode: PrepaymentMode.FULL });
  });

  it('enriches create_service params from prompt', () => {
    const params: Record<string, unknown> = {};
    enrichCreateServiceParamsFromPrompt(
      params,
      'Add massage 60 minutes $80 with 50% online prepayment',
      [],
    );
    expect(params.prepaymentMode).toBe('deposit');
    expect(params.depositPercent).toBe(50);
    expect(
      enrichCreateServicePrepaymentParamsFromPrompt(
        {},
        'Add haircut 30 min $35, no online prepayment',
      ),
    ).toEqual({ prepaymentMode: 'none' });
  });

  describe('create_services bulk prepayment (ai-cmd-ext-5.3)', () => {
    it.each(CREATE_SERVICES_PREPAYMENT_PROMPTS)(
      'detects bulk prepayment prompt $id',
      ({ prompt }) => {
        expect(isCreateServicesPrepaymentPrompt(prompt)).toBe(true);
        expect(hasCreateServicesCue(prompt)).toBe(true);
      },
    );

    it.each(CREATE_SERVICES_PREPAYMENT_PROMPTS)(
      'enriches services array for $id',
      ({ prompt, services }) => {
        const enriched = enrichCreateServicesPrepaymentParamsFromPrompt(
          {},
          prompt,
        );
        const rows = enriched.services as Array<Record<string, unknown>>;
        expect(rows).toHaveLength(services.length);
        for (let index = 0; index < services.length; index += 1) {
          expect(rows[index]?.serviceName).toBe(services[index]!.serviceName);
          expect(rows[index]?.prepaymentMode).toBe(
            services[index]!.prepaymentMode,
          );
        }
      },
    );

    it.each(CREATE_SERVICES_PREPAYMENT_RESCUE_SCENARIOS)(
      'rescues bulk misroute $id to create_services',
      ({ prompt, misclassifiedAction, expectedAction }) => {
        expect(
          rescueCreateServicesPrepaymentIntent(prompt, misclassifiedAction),
        ).toEqual({
          action: expectedAction,
          rescueReason: 'create_services_prepayment',
        });
      },
    );

    it('splits bulk menu segments', () => {
      expect(
        splitBulkCreateServiceSegments(
          'Add services: facemassage 60min $50, haircut 30min $25',
        ),
      ).toHaveLength(2);
    });
  });
});
