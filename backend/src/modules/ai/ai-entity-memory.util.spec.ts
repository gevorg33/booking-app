import {
  applyEntityMemoryToParams,
  formatEntityMemoryContextBlock,
  formatEntityMemoryLine,
  stripSharedEntityMemoryPii,
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
    // e2e-bug.371 — a customer's name must never be rendered into a context
    // block that every user of the business receives. This assertion used to
    // require the opposite.
    const line = formatEntityMemoryLine('john', {
      customerName: 'John',
      templateName: 'Weekday',
    });
    expect(line).not.toContain('John');
    expect(line).toContain('template=Weekday');
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

  it('never fills a customer from the shared map — e2e-bug.371', () => {
    // This test asserted the leak: one user's customer, injected as a *param*
    // of another user's command. Not disclosure — acting on the wrong person.
    const result = applyEntityMemoryToParams(
      {},
      { aliases: { john: { customerName: 'John Smith' } } },
      'offer slot to john',
    );
    expect(result.waitlistCustomerName).toBeUndefined();
    expect(result.customerName).toBeUndefined();
  });

  it('still fills the business-level facts', () => {
    // The capability that is legitimately shared, kept.
    const result = applyEntityMemoryToParams(
      {},
      {
        aliases: {
          gevorg: { employeeName: 'Gevorg A.', serviceName: 'Face massage' },
        },
      },
      'book gevorg tomorrow',
    );
    expect(result.employeeName).toBe('Gevorg A.');
    expect(result.serviceName).toBe('Face massage');
  });

  it('strips customerName on the way in as well as out', () => {
    // Read-side filtering neutralises what is already stored; write-side
    // stripping stops the map growing. Both, because either alone leaves a gap.
    expect(
      stripSharedEntityMemoryPii({
        employeeName: 'Gevorg',
        customerName: 'John Smith',
      }),
    ).toEqual({ employeeName: 'Gevorg' });
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
