import { PrepaymentMode } from '../service/entities/service.entity.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
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
  rescueCreateServicePrepaymentIntent,
  rescueCreateServicesPrepaymentIntent,
} from './ai-create-service-prepayment.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';

describe('ai-create-service-prepayment integration (ai-cmd-ext-5.2)', () => {
  const rescueService = new AiIntentRescueService();
  const planBuilder = new OperationalPlanBuilderService();

  it.each(CREATE_SERVICE_PREPAYMENT_RESCUE_SCENARIOS)(
    'payments rescue routes $id to create_service',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescuePaymentsIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(CREATE_SERVICE_PREPAYMENT_PROMPTS.slice(0, 4))(
    'intent rescue enriches dashboard prompt $id',
    ({ prompt, paramsPartial }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('create_service');
      expect(rescued?.rescued).toBe(true);
      if (paramsPartial?.prepaymentMode) {
        expect(rescued?.params?.prepaymentMode).toBe(paramsPartial.prepaymentMode);
      }
    },
  );

  it('buildCreateServicePlan carries prepayment fields', () => {
    const plan = planBuilder.buildCreateServicePlan({
      businessId: 'biz-1',
      name: 'Color treatment',
      durationMinutes: 90,
      price: 180,
      ...buildCreateServicePrepaymentFields(
        { prepaymentMode: 'deposit', depositPercent: 25 },
        'Add color treatment 90min $180 with 25% online prepayment',
        180,
      ),
    });

    expect(plan.steps[0]?.params).toEqual(
      expect.objectContaining({
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: 45,
      }),
    );
  });

  it('utility rescue matches intent rescue', () => {
    const prompt = 'Add massage 60 minutes $80 with 50% online prepayment';
    expect(rescueCreateServicePrepaymentIntent(prompt, 'unknown')?.action).toBe(
      'create_service',
    );
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('create_service');
  });

  it.each(CREATE_SERVICES_PREPAYMENT_RESCUE_SCENARIOS)(
    'payments rescue routes bulk $id to create_services',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescuePaymentsIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('buildCreateServicesPlan carries per-row prepayment fields', () => {
    const prompt =
      'Add services: massage 60min $80 full prepayment, facial 45min $60 no online prepayment';
    const enriched = enrichCreateServicesPrepaymentParamsFromPrompt({}, prompt);
    const services = (enriched.services as Array<Record<string, unknown>>).map(
      (row) => ({
        name: String(row.serviceName),
        durationMinutes: Number(row.durationMinutes),
        price: Number(row.price),
        bufferMinutes: 0,
        currency: 'USD',
        ...buildCreateServicePrepaymentFields(row, prompt, Number(row.price)),
      }),
    );

    const plan = planBuilder.buildCreateServicesPlan({
      businessId: 'biz-1',
      services,
    });

    expect(plan.steps[0]?.params?.prepaymentMode).toBe('full');
    expect(plan.steps[1]?.params?.prepaymentMode).toBe('none');
  });
});
