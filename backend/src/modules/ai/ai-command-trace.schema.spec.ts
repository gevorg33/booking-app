import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';
import {
  AiCommandTrace,
  type AiCommandTraceOutcome,
  type AiCommandTraceSource,
} from './entities/ai-command-trace.entity.js';

const migrationPath = join(
  __dirname,
  '../../../database/migrations/20260701120000-ai-command-trace.sql',
);

const ACC_1_1_COLUMNS = [
  'trace_id',
  'business_id',
  'surface',
  'user_id',
  'role',
  'raw_prompt',
  'normalized_prompt',
  'locale',
  'action',
  'confidence',
  'params',
  'routing_tier',
  'source',
  'outcome',
  'latency_ms',
  'model',
  'token_cost',
] as const;

const ACC_1_1_INDEXES = [
  'idx_ai_command_trace_trace_id',
  'idx_ai_command_trace_business_created',
  'idx_ai_command_trace_surface_action',
  'idx_ai_command_trace_outcome',
] as const;

const ACC_1_1_OUTCOMES: AiCommandTraceOutcome[] = [
  'executed',
  'clarified',
  'approval',
  'failed',
  'security_blocked',
];

const ACC_1_1_SOURCES: AiCommandTraceSource[] = ['deterministic', 'llm'];

describe('ai_command_trace schema (acc-1.1)', () => {
  const migrationSql = readFileSync(migrationPath, 'utf8');

  it.each(ACC_1_1_COLUMNS)('migration defines column %s', (column) => {
    expect(migrationSql).toContain(column);
  });

  it.each(ACC_1_1_INDEXES)('migration defines index %s', (indexName) => {
    expect(migrationSql).toContain(indexName);
  });

  it('registers ai_command_trace table on entity', () => {
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === AiCommandTrace,
    );
    expect(table?.name).toBe('ai_command_trace');
  });

  it('maps acc-1.1 entity columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === AiCommandTrace)
      .map((column) => column.options.name ?? column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining([
        'trace_id',
        'business_id',
        'surface',
        'user_id',
        'role',
        'raw_prompt',
        'normalized_prompt',
        'locale',
        'action',
        'confidence',
        'params',
        'routing_tier',
        'source',
        'outcome',
        'latency_ms',
        'model',
        'token_cost',
        'created_at',
      ]),
    );
  });

  it('declares acc-1.1 outcome and source unions', () => {
    expect(ACC_1_1_OUTCOMES).toHaveLength(5);
    expect(ACC_1_1_SOURCES).toEqual(['deterministic', 'llm']);
  });

  it('indexes business_id + created_at, surface + action, and outcome', () => {
    const indexes = getMetadataArgsStorage()
      .indices.filter((index) => index.target === AiCommandTrace)
      .map((index) => index.name);

    expect(indexes).toEqual(
      expect.arrayContaining([
        'idx_ai_command_trace_business_created',
        'idx_ai_command_trace_surface_action',
        'idx_ai_command_trace_outcome',
        'idx_ai_command_trace_trace_id',
      ]),
    );
  });
});
