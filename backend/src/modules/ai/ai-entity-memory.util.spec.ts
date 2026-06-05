import {
  applyEntityMemoryToParams,
  formatEntityMemoryContextBlock,
  formatEntityMemoryLine,
  findAliasMentionsInPrompt,
  normalizeEntityAlias,
} from './ai-entity-memory.util.js';

describe('ai-entity-memory.util', () => {
  it('normalizes aliases', () => {
    expect(normalizeEntityAlias('  Gevorg ')).toBe('gevorg');
  });

  it('formats memory lines and blocks', () => {
    expect(
      formatEntityMemoryLine('gevorg', { employeeName: 'Gevorg A.' }),
    ).toContain('provider=Gevorg');
    expect(
      formatEntityMemoryLine('john', {
        customerName: 'John',
        templateName: 'Weekday',
      }),
    ).toContain('customer=John');
    expect(
      formatEntityMemoryContextBlock({
        aliases: {
          gevorg: { employeeName: 'Gevorg' },
          massage: { serviceName: 'Face massage' },
        },
      }),
    ).toContain('"gevorg"');
    expect(formatEntityMemoryContextBlock({} as any)).toBe('');
  });

  it('applies memory when prompt mentions alias', () => {
    const result = applyEntityMemoryToParams(
      {},
      { aliases: { gevorg: { employeeName: 'Gevorg', serviceName: 'Cut' } } },
      'Show gevorg appointments',
    );
    expect(result.employeeName).toBe('Gevorg');
    expect(result.serviceName).toBe('Cut');
  });

  it('does not override explicit params', () => {
    const result = applyEntityMemoryToParams(
      { employeeName: 'Maria' },
      { aliases: { gevorg: { employeeName: 'Gevorg' } } },
      'gevorg today',
    );
    expect(result.employeeName).toBe('Maria');
  });

  it('finds alias mentions in prompt', () => {
    expect(
      findAliasMentionsInPrompt('book gevorg for facemassage', {
        gevorg: { employeeName: 'Gevorg' },
        facemassage: { serviceName: 'Face massage' },
      }),
    ).toEqual(['gevorg', 'facemassage']);
  });

  it('maps customer alias to waitlistCustomerName when missing', () => {
    const result = applyEntityMemoryToParams(
      {},
      { aliases: { john: { customerName: 'John Smith' } } },
      'offer slot to john',
    );
    expect(result.waitlistCustomerName).toBe('John Smith');
  });

  it('applies templateName and preserves existing customerName', () => {
    const result = applyEntityMemoryToParams(
      { customerName: 'Alice' },
      { aliases: { weekday: { templateName: 'Weekday template' } } },
      'apply weekday schedule',
    );
    expect(result.templateName).toBe('Weekday template');
    expect(result.customerName).toBe('Alice');
  });

  it('returns empty block for empty memory', () => {
    expect(formatEntityMemoryContextBlock({ aliases: {} })).toBe('');
    expect(formatEntityMemoryLine('x', {})).toContain('—');
  });

  it('skips empty alias keys when applying memory', () => {
    expect(
      applyEntityMemoryToParams(
        {},
        { aliases: { '': { employeeName: 'X' } } },
        'book',
      ),
    ).toEqual({});
  });

  it('handles memory objects without aliases map', () => {
    expect(applyEntityMemoryToParams({}, {} as any, 'gevorg')).toEqual({});
  });

  it('does not overwrite params already set from memory', () => {
    const result = applyEntityMemoryToParams(
      {
        employeeName: 'Maria',
        serviceName: 'Cut',
        waitlistCustomerName: 'Ann',
      },
      {
        aliases: {
          gevorg: {
            employeeName: 'Gevorg',
            serviceName: 'Massage',
            customerName: 'John',
          },
        },
      },
      'gevorg massage john',
    );
    expect(result.employeeName).toBe('Maria');
    expect(result.serviceName).toBe('Cut');
    expect(result.waitlistCustomerName).toBe('Ann');
  });
});
