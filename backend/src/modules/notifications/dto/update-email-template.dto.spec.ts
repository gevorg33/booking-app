import { plainToInstance } from 'class-transformer';
import {
  CustomEmailVariableDto,
  EMAIL_TEMPLATE_KEYS,
  ReplaceCustomEmailVariablesDto,
  UpdateEmailTemplateDto,
} from './update-email-template.dto.js';

describe('update-email-template.dto', () => {
  it('exports all template keys and dto classes', () => {
    expect(EMAIL_TEMPLATE_KEYS).toEqual([
      'booking_confirmation',
      'booking_confirmation_grouped',
      'booking_reminder',
      'booking_cancellation',
      'review_request',
      'gift_card_recipient',
      'gift_card_purchaser_receipt',
    ]);

    const updateDto = new UpdateEmailTemplateDto();
    updateDto.enabled = true;
    updateDto.subject = 'Subject';
    updateDto.bodyText = 'Text';
    updateDto.bodyHtml = '<p>Html</p>';
    expect(updateDto.enabled).toBe(true);

    const variableDto = new CustomEmailVariableDto();
    variableDto.key = 'promo_line';
    variableDto.label = 'Promo';
    variableDto.defaultValue = '10% off';

    const replaceDto = new ReplaceCustomEmailVariablesDto();
    replaceDto.variables = [variableDto];
    expect(replaceDto.variables).toHaveLength(1);

    const transformed = plainToInstance(ReplaceCustomEmailVariablesDto, {
      variables: [{ key: 'promo_line', label: 'Promo', defaultValue: '10% off' }],
    });
    expect(transformed.variables[0]).toBeInstanceOf(CustomEmailVariableDto);
  });
});
