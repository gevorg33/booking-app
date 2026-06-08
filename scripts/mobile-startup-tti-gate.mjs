#!/usr/bin/env node
/** adopt-5.2 / adopt-5.7 — cold-start TTI budget + startup regression alarm gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const checks = [
  {
    file: 'consumer-app/capacitor.config.ts',
    pattern: /launchAutoHide:\s*false/,
    message: 'consumer splash must wait for app_interactive',
  },
  {
    file: 'provider-app/capacitor.config.ts',
    pattern: /launchAutoHide:\s*false/,
    message: 'provider splash must wait for app_interactive',
  },
  {
    file: 'consumer-app/src/lib/app-startup.util.ts',
    pattern: /APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS\s*=\s*4_500/,
    message: 'low-end Android TTI budget must be 4500ms',
  },
  {
    file: 'consumer-app/src/App.tsx',
    pattern: /lazy\(\(\)\s*=>\s*import\(/,
    message: 'consumer routes must use lazy code-splitting',
  },
  {
    file: 'provider-app/src/App.tsx',
    pattern: /lazy\(\(\)\s*=>\s*import\(/,
    message: 'provider routes must use lazy code-splitting',
  },
  {
    file: 'backend/src/common/utils/startup-tti-slo.util.ts',
    pattern: /STARTUP_TTI_WITHIN_BUDGET_SLO\s*=\s*0\.95/,
    message: 'startup TTI within-budget SLO must be 95%',
  },
  {
    file: 'backend/src/common/utils/startup-tti-regression.util.ts',
    pattern: /STARTUP_TTI_WEEKLY_REGRESSION_DELTA\s*=\s*0\.03/,
    message: 'startup TTI weekly regression alarm threshold must be 3 pts',
  },
  {
    file: 'consumer-app/src/components/AppStartupBridge.tsx',
    pattern: /app_interactive/,
    message: 'consumer must emit app_interactive for TTI telemetry',
  },
  {
    file: 'provider-app/src/components/AppStartupBridge.tsx',
    pattern: /app_interactive/,
    message: 'provider must emit app_interactive for TTI telemetry',
  },
  {
    file: 'frontend/src/components/adoption-dashboard-panel.tsx',
    pattern: /startupTtiRegressionAlertTitle/,
    message: 'adoption dashboard must surface startup TTI regression alarm',
  },
  {
    file: 'backend/src/common/utils/app-adoption-analytics.util.ts',
    pattern: /weeklyStartupTtiRegressionAlert/,
    message: 'adoption export must include weekly startup TTI regression alert',
  },
];

let failed = false;
for (const check of checks) {
  const fullPath = path.join(ROOT, check.file);
  if (!fs.existsSync(fullPath)) {
    failed = true;
    console.error(`✗ missing ${check.file}`);
    continue;
  }
  const source = fs.readFileSync(fullPath, 'utf8');
  if (!check.pattern.test(source)) {
    failed = true;
    console.error(`✗ ${check.message} (${check.file})`);
  } else {
    console.log(`✓ ${check.message}`);
  }
}

process.exit(failed ? 1 : 0);
