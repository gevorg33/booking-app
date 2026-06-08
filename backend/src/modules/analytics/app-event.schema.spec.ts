import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';
import {
  APP_ADOPTION_EVENTS,
  APP_EVENT_RATE_LIMIT_MAX,
  APP_EVENT_RATE_LIMIT_WINDOW_MS,
} from '../../common/utils/app-adoption-analytics.fixtures.js';
import { AppEvent } from './entities/app-event.entity.js';

const migrationPath = join(
  __dirname,
  '../../../database/migrations/20260801120000-app-event.sql',
);

const ADOPT_1_3_COLUMNS = [
  'business_id',
  'anon_id',
  'event',
  'platform',
  'app_surface',
  'app_version',
  'locale',
  'tenant_slug',
  'session_id',
  'start_type',
  'user_type',
  'props',
  'created_at',
] as const;

const ADOPT_1_3_INDEXES = [
  'idx_app_event_business_event_created',
  'idx_app_event_platform',
  'idx_app_event_anon_id',
  'idx_app_event_business_created',
] as const;

describe('app_event schema (adopt-1.3)', () => {
  const migrationSql = readFileSync(migrationPath, 'utf8');

  it.each(ADOPT_1_3_COLUMNS)('migration defines column %s', (column) => {
    expect(migrationSql).toContain(column);
  });

  it.each(ADOPT_1_3_INDEXES)('migration defines index %s', (indexName) => {
    expect(migrationSql).toContain(indexName);
  });

  it('registers app_event table on entity', () => {
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === AppEvent,
    );
    expect(table?.name).toBe('app_event');
  });

  it('maps adopt-1.3 entity columns', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === AppEvent)
      .map((column) => column.options.name ?? column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining([...ADOPT_1_3_COLUMNS]),
    );
  });

  it('indexes businessId+event+createdAt, platform, and anonId', () => {
    const indexes = getMetadataArgsStorage()
      .indices.filter((index) => index.target === AppEvent)
      .map((index) => index.name);

    expect(indexes).toEqual(expect.arrayContaining([...ADOPT_1_3_INDEXES]));
  });

  it('declares adoption event allowlist used by ingest validation', () => {
    expect(APP_ADOPTION_EVENTS).toContain('app_opened');
    expect(APP_ADOPTION_EVENTS).toContain('completed_booking');
  });

  it('declares ingest rate-limit constants', () => {
    expect(APP_EVENT_RATE_LIMIT_MAX).toBe(100);
    expect(APP_EVENT_RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });
});
