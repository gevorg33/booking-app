import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getMetadataArgsStorage } from 'typeorm';
import { ClinicSpecimen } from '../entities/clinic-specimen.entity.js';
import { ClinicSpecimenStorageLocation } from '../entities/clinic-specimen-storage-location.entity.js';
import { ClinicTransportFolder } from '../entities/clinic-transport-folder.entity.js';
import { ClinicSpecimenStatusHistory } from '../entities/clinic-specimen-status-history.entity.js';

const storageMigrationPath = join(
  __dirname,
  '../../../../database/migrations/20260612120000-clinic-specimens-storage-transport.sql',
);
const historyMigrationPath = join(
  __dirname,
  '../../../../database/migrations/20260613120000-clinic-specimen-status-history.sql',
);

describe('clinic specimen schema (vert-clinic-2.3.1)', () => {
  const storageMigrationSql = readFileSync(storageMigrationPath, 'utf8');
  const historyMigrationSql = readFileSync(historyMigrationPath, 'utf8');

  it.each([
    'clinic_specimen_storage_locations',
    'clinic_transport_folders',
    'storage_location_id',
    'transport_folder_id',
    'stored_at',
    'origin_storage_location_id',
    'destination_storage_location_id',
  ])('storage migration defines %s', (fragment) => {
    expect(storageMigrationSql).toContain(fragment);
  });

  it.each(['clinic_specimen_status_history', 'previous_status', 'specimen_id'])(
    'history migration defines %s',
    (fragment) => {
      expect(historyMigrationSql).toContain(fragment);
    },
  );

  it('maps specimen entity columns for storage and transport refs', () => {
    const columns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === ClinicSpecimen)
      .map((column) => column.options.name ?? column.propertyName);

    expect(columns).toEqual(
      expect.arrayContaining([
        'collected_at',
        'storage_location_id',
        'stored_at',
        'transport_folder_id',
      ]),
    );
  });

  it('registers storage location and transport folder entities', () => {
    const tables = getMetadataArgsStorage()
      .tables.filter((table) => typeof table.target === 'function')
      .map((table) => table.name);

    expect(tables).toContain('clinic_specimen_storage_locations');
    expect(tables).toContain('clinic_transport_folders');
    expect(tables).toContain('clinic_specimen_status_history');
    expect(
      getMetadataArgsStorage().tables.some(
        (t) => t.target === ClinicSpecimenStorageLocation,
      ),
    ).toBe(true);
    expect(
      getMetadataArgsStorage().tables.some(
        (t) => t.target === ClinicTransportFolder,
      ),
    ).toBe(true);
    expect(
      getMetadataArgsStorage().tables.some(
        (t) => t.target === ClinicSpecimenStatusHistory,
      ),
    ).toBe(true);
  });
});
