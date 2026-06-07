#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET_DIRS = [
  path.resolve(__dirname, '../src/modules/clinic-test-results'),
  path.resolve(__dirname, '../src/modules/patient-clinical-profiles'),
  path.resolve(__dirname, '../src/modules/clinic-tasks'),
  path.resolve(__dirname, '../src/modules/clinic-lis'),
];
  'patientPlanId',
  'PatientPlan',
  'HormoneType',
  'fertilityIQImageURL',
  'FertilityIQ',
  'sperm-cryo',
  'egg-freez',
  'ObUltrasound',
  'OHSS',
  'cohort',
  'stim',
  'GTPAL',
  'partnerCycle',
  'partner_cycle',
];

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(ts|tsx|js|sql)$/.test(entry) && !entry.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const targetDir of TARGET_DIRS) {
  for (const file of walk(targetDir)) {
    const content = readFileSync(file, 'utf8');
    for (const term of FORBIDDEN) {
      if (content.includes(term)) {
        violations.push({ file, term });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('De-fertility gate failed under clinic chart modules:');
  for (const v of violations) {
    console.error(`  ${v.term} in ${path.relative(process.cwd(), v.file)}`);
  }
  process.exit(1);
}

console.log('De-fertility gate passed for clinic chart modules');
