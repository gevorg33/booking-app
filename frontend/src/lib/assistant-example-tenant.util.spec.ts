import { describe, expect, it } from 'vitest';
import {
  interpolateAssistantTemplate,
  pickAssistantExampleVars,
} from './assistant-example-tenant.util';

describe('assistant-example-tenant.util', () => {
  const fallbacks = {
    provider: 'your provider',
    service: 'a service',
    service2: 'another service',
    serviceCategory: 'your services',
  };

  it('picks assigned service and employee names', () => {
    const vars = pickAssistantExampleVars(
      {
        employees: [{ id: 'e1', name: 'Anna', serviceIds: ['s2'], isActive: true }],
        services: [
          { id: 's1', name: 'Haircut', categoryName: 'Cuts', isActive: true },
          { id: 's2', name: 'Deep tissue', categoryName: 'Massage', isActive: true },
        ],
      },
      fallbacks,
    );
    expect(vars.provider).toBe('Anna');
    expect(vars.service).toBe('Deep tissue');
    expect(vars.service2).toBe('Haircut');
    expect(vars.serviceCategory).toBe('Massage');
  });

  it('uses fallbacks when tenant catalog is empty', () => {
    expect(pickAssistantExampleVars(null, fallbacks)).toEqual(fallbacks);
  });

  it('interpolates template placeholders', () => {
    expect(
      interpolateAssistantTemplate('Book {service} with {provider}', {
        service: 'Facial',
        provider: 'Sam',
      }),
    ).toBe('Book Facial with Sam');
  });
});
