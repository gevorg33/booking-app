import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { LoyaltyAwardService } from '../modules/loyalty/loyalty-award.service.js';

async function main() {
  const businessId = process.argv[2];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const loyaltyAwardService = app.get(LoyaltyAwardService);
    const scope = businessId ? `tenant ${businessId}` : 'all tenants';
    console.log(`Running loyalty backfill for ${scope}...`);

    const summary = await loyaltyAwardService.backfillPaidBookings(businessId);

    console.log('\n=== Loyalty backfill summary ===');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
